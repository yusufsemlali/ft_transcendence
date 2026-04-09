# Application Specification: ft_transcendence

## 1. Project Overview
**ft_transcendence** is a comprehensive e-sports and tournament management platform. It allows users to create organizations, host tournaments for various games (Riot Games, Steam, etc.), manage matches, and engage in social interactions through a real-time chat system and friend management.

The platform is designed with a focus on competitive integrity, featuring ELO ratings, XP-based leveling, and verified game handles.

## 2. Global Architecture
The application follows a micro-service inspired architecture managed within a **pnpm workspace**, containerized using **Docker**.

### Services:
- **Frontend**: Next.js 15 application.
- **Backend (Main)**: Express.js REST API (Main business logic).
- **Chat**: Dedicated Socket.io server for real-time messaging.
- **Database**: PostgreSQL managed via Drizzle ORM.
- **Shared**: A `contracts` package that defines the API interface and data schemas using Zod, ensuring type safety across all services.

### Communication:
- **REST**: Frontend to Backend communication is governed by `@ts-rest`, ensuring that the API implementation always matches the shared contract.
- **WebSockets**: Real-time updates for chat and notifications are handled via `socket.io`.
- **Cross-Service Sync**: While the Main Backend handles persistent state (DB), the Chat service maintains its own real-time connections, synchronizing with the DB as needed.

---

## 3. Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router).
- **Dual State Strategy**:
    - **Synchronous/Client State**: Redux Toolkit manages UI state (modals, toasts) and global Auth status.
    - **Asynchronous/Server State**: TanStack Query (React Query) handles all server data fetching, caching, and mutations via `@ts-rest/react-query`.
- **Styling**: Tailwind CSS 4, CSS Variables, Material Symbols.
- **Component Library**: Base UI (headless components for maximum flexibility).
- **Validation**: Zod (shared with backend).

### Backend (Main & Chat)
- **Runtime**: Node.js with TypeScript (`tsx` for development).
- **Framework**: Express.js.
- **ORM**: Drizzle ORM (PostgreSQL driver).
- **Authentication**: JWT (JSON Web Tokens) stored in HTTP-only cookies (`access_token` and `refresh_token`).
- **Real-time**: Socket.io (Centralized in the `chat` service).

---

## 4. Feature Modules

### 4.1. Authentication & User Management
- **Identity**: Users have unique usernames and verified emails.
- **Roles**: Support for `user`, `admin`, `moderator`, and `organizer`.
- **Progression**: XP and Leveling system based on platform activity.
- **Game Profiles**: Users can link external game accounts (e.g., Riot ID, Steam ID, PSN) for tournament participation.

### 4.2. Social & Networking
- **Friends System**: Send/Receive requests, block players, and view online status.
- **Chat**: Private messages and (potentially) channel-based communication.
- **Notifications**: Real-time alerts for match invites, friend requests, and tournament updates.

### 4.3. Tournament & Lobby Architecture
The platform implements a sophisticated **Lobby-Competitor-Roster** system to handle complex team registrations:
- **Lobby**: Tracking individual users present in the tournament context (`solo`, `rostered`, or `spectator`).
- **Competitors**: Theoretical entities in the bracket (can be a Solo player or a Team).
- **Rosters**: Maps Lobby users to Competitors with specific roles (`captain`, `player`, `substitute`).
- **Invites**: Relational tracking of pending team invitations within a tournament.

### 4.4. Matchmaking & Gameplay
- **ELO Rating**: Competitive ranking system.
- **Match Engine**: Scoring types include `points_high`, `time_low`, `sets`, `binary`, and `stocks`.
- **Match Recording**: Detailed match history and statistics.

### 4.5. Security & Middleware
- **Frontend Middleware**: Protects routes (`/settings`, `/dashboard`, etc.) based on the presence of HTTP-only JWT cookies.
- **Backend API Protection**: 
    - `authenticateTsRestRequest`: Global middleware verifying JWTs.
    - `Role-based Access Control (RBAC)`: Enforced at the controller level for sensitive operations (admin/organizer tasks).
    - `Rate Limiting`: Implemented for heavy endpoints (e.g., file uploads) and auth routes.

---

## 5. Database Schema (Drizzle)
The database is structured into several core modules:
- **Users & Auth**: `users`, `sessions`, `refresh_tokens`.
- **Social**: `social` (friends/blocks), `notifications`.
- **Tournament Core**: `tournaments`, `organizations`, `sports`, `lobby`.
- **Matches**: `matches`, `match_participants`.
- **Identity**: `handles` (external game identifiers).
- **Settings**: Site-wide and user-specific configuration.

---

## 6. Directory Structure
```text
.
├── srcs/
│   ├── requirements/
│   │   ├── backend/          # Express API, DAL, Services
│   │   ├── chat/             # Socket.io Chat Server
│   │   ├── frontend/         # Next.js App
│   │   ├── shared/
│   │   │   └── contracts/    # Shared Zod schemas and ts-rest contracts
│   │   ├── database/         # DB initialization scripts
│   │   └── nginx/            # Reverse proxy configuration
│   ├── .env                  # Environment variables
│   └── docker-compose.yml    # Container orchestration
├── Makefile                  # Build and deployment automation
└── pnpm-workspace.yaml       # Workspace definition
```

---


---

## 7. API Endpoints Reference
The platform uses a contract-driven API approach. Below is a summary of the major functional endpoint groups:

### 8.1. Authentication (`/auth`)
- **`POST /auth/register`**: Register a new account with email/password.
- **`POST /auth/login`**: Standard login; returns JWTs via HTTP-only cookies.
- **`GET /auth/42/login` & `GET /auth/42/callback`**: OAuth2 integration for 42 Intra students.
- **`POST /auth/refresh`**: Silent token rotation for seamless sessions.
- **`POST /auth/logout`**: Clears authentication cookies and invalidates the session.
- **`GET /auth/sessions`**: View and manage all active device sessions for the user.

### 8.2. User Management (`/users`)
- **`GET /users/me`**: Fetches the full profile of the authenticated user.
- **`PATCH /users/me`**: Updates personal information (bio, avatar, display name).
- **`GET /users/search`**: Search the platform database for other players.
- **`GET /users/by-id/:id`**: Public profile details including stats and XP.

### 8.3. Social & Friends (`/friends`)
- **`GET /friends`**: Lists all confirmed friends with online status.
- **`POST /friends/requests`**: Send a new friend request.
- **`GET /friends/requests`**: View pending incoming and outgoing requests.
- **`POST /friends/requests/:id/accept`**: Confirm a friendship.

### 8.4. Tournaments & Lobbies (`/tournaments`)
- **`GET /tournaments`**: Public discovery list with filters for sport, status, and search.
- **`POST /tournaments/:id/lobby/join`**: Register and enter the live waiting room for an event.
- **`GET /tournaments/:id/lobby`**: Real-time state of players and teams in the lobby.
- **`POST /tournaments/:id/lobby/competitors`**: Form a team or group for team-based tournaments.
- **`POST /tournaments/:id/lobby/competitors/:id/invite`**: Invite solo players into a team.

### 8.5. Organizations (`/organizations`)
- **`POST /organizations`**: Create a new hosting entity.
- **`GET /organizations/:id/members`**: Manage the team behind the tournaments (Admins, Moderators).
- **`GET /organizations/:orgId/tournaments`**: Dashboard for organizers to manage their events.

### 8.6. Identity & Game Handles (`/handles`)
- **`POST /handles`**: Link external identities (Steam, Riot ID, PSN) to the account.
- **`GET /handles/verify`**: Trigger verification process for linked game accounts.

### 8.7. Utilities & Files (`/files`)
- **`POST /files/upload`**: Secure endpoint for uploading avatars and tournament banners (heavily rate-limited).
- **`GET /notifications`**: Fetch and manage unread real-time alerts.

---

## 8. Development Workflow
- **Contract-First**: Always update `srcs/requirements/shared/contracts` before modifying API endpoints.
- **Type Safety**: Avoid `any`. Use the types generated from Zod schemas in the contracts.
- **Responsiveness**: Frontend must be mobile-first and fully responsive.
- **Real-time**: Use the `Chat` service for real-time events, not the main Backend polling.
- **File Writing**: The workspace lives on a `goinfre` network mount. The IDE `Write` tool produces **UTF-16** files on this filesystem, which breaks TypeScript and all tooling. **Always create and edit files via shell `cat` heredocs** (e.g. `cat > path << 'ENDOFFILE' ... ENDOFFILE`) to guarantee clean UTF-8 encoding. Never use the built-in Write tool for new files in this project.
