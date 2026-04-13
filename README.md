*This project has been created as part of the 42 curriculum by ysemlali, mbouras, adouiyeh, alakhdar.*

# Tournify

## Description
Tournify is a real-time tournament management platform that allows users to organize and track bracket-based tournaments, interact via live chat, and manage their social connections through a comprehensive friends system. It features an advanced administrator dashboard for user and tournament management, real-time hydration of application state, and secure deployment techniques. It intentionally abstracts away the actual gameplay to focus entirely on robust tournament state administration.

The primary goal of this project is to build a full-stack, single-page application (SPA) complying with rigid requirements for modern web architecture, encompassing everything from database schema design to frontend state management.

## Instructions

### Prerequisites
- Docker & Docker Compose
- Make
- Node.js (for local testing without Docker, if necessary)
- Git

### Installation & Execution
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd ft_transcendence
   ```
2. Set up environment variables:
   Copy the provided `.env.example` file to create your own configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit the `.env` file to include your database credentials, API keys, and secret keys.*

3. Start the application:
   Build and start all services using the provided Makefile:
   ```bash
   make up
   ```
4. Access the application:
   Navigate to `https://localhost:8080` or `https://127.0.0.1:8080` in your browser. (Note: The application enforces HTTPS).

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [ts-rest Documentation](https://ts-rest.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Redux Toolkit](https://redux-toolkit.js.org/)

**AI Usage Statement:**
AI was used to facilitate learning and overcome specific software engineering roadblocks:
- Generating generic boilerplate code for React components and Zod validation schemas.
- Researching best practices regarding Server-Sent Events vs WebSockets for real-time hydration.
- Troubleshooting CSS/Tailwind responsiveness issues within the tournament dashboard layout.

## Team Information
- **Youssef (ysemlali)** - PO, PM, Tech Lead
  - *Responsibilities:* Entire backend engineering and architecture, project organization, coordinating merges, system architecture overview, technology stack selection, and overseeing real-time capabilities/tournament logic.
- **Mohamed (mbouras)** - Developer
  - *Responsibilities:* Implementing the frontend friends UI logic, frontend authentication paths, and frontend components of the admin dashboard.
- **Ali (adouiyeh)** - Developer
  - *Responsibilities:* Implementation of the frontend chat interfaces, message delivery UI, typing indicators, and user-to-user messaging components.
- **Achraf (alakhdar)** - Developer
  - *Responsibilities:* Implementing the frontend tournament lobby joining UI, developing mandatory privacy and terms pages, and resolving minor frontend components.

## Project Management
- **Organization:** The team organized tasks via Jira for Kanban tracking and issue management, dividing responsibilities vertically. Youssef managed the entire backend architecture exclusively, while the remaining team members specialized on robust frontend component integrations.
- **Meetings:** Conducted daily syncs on Discord to align on merge conflicts (especially regarding the `main` and `chat` branches) and unblock dependencies.
- **Version Control:** Managed features through Git branches, conducting peer reviews before executing major merges into the `main` trunk.

## Technical Stack
- **Frontend Framework:** Next.js (React) - Chosen for its powerful App Router, allowing a robust mixture of server and client components, along with rapid initial loading and great developer experience.
- **Frontend Styling:** Tailwind CSS for rapid styling and highly responsive UI creation.
- **Frontend State:** Redux Toolkit to maintain complex states like nested tournament brackets and global user sessions.
- **Backend Framework:** Node.js with Express - Chosen for its massive ecosystem and lightweight footprint, allowing rapid creation of REST APIs and SSE endpoints.
- **API Architecture:** `ts-rest` (Contract-First) - Implemented to strictly define routing endpoints in a shared TypeScript library. This guarantees end-to-end type safety between the frontend requests and backend resolvers, while automatically generating OpenAPI documentation.
- **Database:** PostgreSQL managed via Drizzle ORM - Chosen because PostgreSQL provides rock-solid relational data integrity, while Drizzle gives us supreme TypeScript type safety across the database layer.
- **Real-Time Delivery:** Server-Sent Events (SSE) - Utilized for unidirectional server-to-client real-time updates (like game starts or tournament progression) which is a lighter alternative to WebSockets for pure notifications.

## Database Schema
The database uses a completely relational structure designed in PostgreSQL:
- **`users`**: Contains credentials, profile data, avatars, user settings, status (online/offline), and role identifiers (Admin, User).
- **`friends` / `friend_requests`**: Connects user constraints tracking pending, accepted, rejected, and blocked player interactions.
- **`tournaments`**: Stores tournament metadata, capacity, current status, start time, and bracket structure keys.
- **`matches`**: Links to a tournament, stores Player A, Player B, current scores, timestamps, and termination status reported by users or administrators.
- **`chat_channels` / `messages`**: Handles direct messages and potentially group chats, storing timestamps, sender references, and message payloads.

## Features List
- **Real-Time Friends System:** Users can search for other players safely, send requests, block, unblock, and see live connection status updates. (*Implemented largely by mbouras*).
- **Real-Time Chat Context:** Allows users to message each other in application, linking back to fully detailed user profiles. (*Implemented by adouiyeh*).
- **Tournament Generation & Brackets:** Administrators can create tournaments, enforce capacity limits, and remotely update match states which aggressively hydrate connected clients through SSE. (*Implemented by ysemlali*).
- **Organization & Role-Based Permissions:** Different layers of the SPA are locked down. The admin dashboard is strictly visible only to authenticated users carrying elevated privileges. (*Implemented by ysemlali & mbouras*).
- **Complete Privacy & ToS Provision:** Standardized legally required reading materials are injected correctly into the frontend flow. (*Implemented by alakhdar*).

## Modules
**Total Claims:** 14 Points

1. **(Major - 2pts) Use a framework for both the frontend and backend:** Implemented via Next.js on the client and Express.js on the backend. Justified to enforce modularity and routing hierarchy.
2. **(Major - 2pts) Real-time features:** Implemented utilizing Server-Sent Events (SSE) for both tournament hydrations and lobby synchronization.
3. **(Major - 2pts) Standard user management:** Built out completely with profiles, settings handling, avatar uploads, and tracking of player statistics.
4. **(Major - 2pts) Allow users to interact with other users:** Features a robust Chat interface alongside a sophisticated active friends mechanism.
5. **(Major - 2pts) Advanced permissions system:** A fully realized Admin dashboard supports complete CRUD logic over users and system organization, properly protected by backend middleware.
6. **(Major - 2pts) Custom Module - Comprehensive Tournament Management:** Addressing the complexity of bracket rendering, we replaced an active game instance with an advanced tournament manager. It handles drag-and-drop matches, bracket logic, round-robins, and real-time state propagation—justifying a 2-point major focus over a simple web game.
7. **(Minor - 1pt) File upload and management system:** Supports secure profile avatar uploads directly configured and processed through backend static asset systems via Multer.
8. **(Minor - 1pt) Use an ORM for the database:** Implemented `drizzle-orm` for robust type-safe schema modeling against our Postgres cluster.

## Individual Contributions
- **Youssef (ysemlali):** Engineered and constructed the entirety of the backend service architecture, including all REST APIs, Drizzle ORM schemas, and server-side logic across all domains. Designed the real-time Server-Sent Events capabilities, provisioned Docker infra, and implemented complex Redux patterns for drag-and-drop matchmaking.
- **Mohamed (mbouras):** Focused purely on the frontend application, handling extensive elements of the user interfacing, heavily programming the frontend Friends flow (send, accept, block UI). Spearheaded the frontend administration panels for managing users and roles within Next.js layouts.
- **Ali (adouiyeh):** Constructed the frontend messaging interfaces. Bootstrapped the chat UI skeleton, tying frontend dispatches to the SSE streams, and ensuring the user-to-user application components rendered messages smoothly.
- **Achraf (alakhdar):** Developed the frontend core tournament lobby joining UI to handle user participations. Contributed to refining UI flaws and delivered the static application routes for the Terms of Service and Privacy Policy to ensure rigid compliance.
