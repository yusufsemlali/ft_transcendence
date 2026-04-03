# Backend Testing Guide with Postman

This guide provides a detailed overview of all available backend endpoints and instructions on how to test them using Postman.

## 🚀 Getting Started

### 1. Base URL
All API requests should be made to:
`https://localhost:8080/api` (via NGINX)
or
`http://localhost:8080/api` (depending on your local setup)

### 2. Postman Environment Setup
Create a new environment in Postman and add the following variables:
- `baseUrl`: `https://localhost:8080/api`
- `accessToken`: (Leave empty, will be populated automatically)

---

## 🔐 Authentication Flow

Most endpoints require a valid JWT token in the `Authorization` header.

### Step 1: Register or Login
Use the `POST /auth/register` or `POST /auth/login` endpoints.

### Step 2: Automatic Token Handling
To avoid copying the token manually, add this script to the **Tests** tab of your Login/Register request:

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.token);
}
```

### Step 3: Authenticated Requests
For all other requests, go to the **Auth** tab, select **Bearer Token**, and use `{{accessToken}}` as the value.

---

## 📂 Endpoint Reference

### 🗝️ Auth Endpoints

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login with email and password |
| `POST` | `/auth/refresh` | Refresh access token (uses cookie) |
| `POST` | `/auth/logout` | Logout current session |
| `POST` | `/auth/logout-all` | Logout all sessions |
| `GET` | `/auth/sessions` | Get all active sessions |
| `GET` | `/auth/42/login` | Get 42 Intra auth URL |

#### Request Body Examples:

**Register:**
```json
{
  "email": "test@example.com",
  "username": "tester123",
  "password": "StrongPassword123!"
}
```

**Login:**
```json
{
  "email": "test@example.com",
  "password": "StrongPassword123!"
}
```

---

### 🏢 Organizations

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/organizations` | Create a new organization |

#### Request Body Example:
```json
{
  "name": "Global Gaming League",
  "slug": "gg-league",
  "description": "The premier league for global gamers"
}
```

---

### 🏆 Tournaments

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/tournaments` | Create a new tournament |
| `GET` | `/tournaments` | List all tournaments |

#### Request Body Example:
```json
{
  "organizationId": "PASTE_ORG_ID_HERE",
  "sportId": "PASTE_SPORT_ID_HERE",
  "name": "Summer Championship 2024",
  "description": "Annual summer tournament",
  "format": "single_elimination",
  "maxParticipants": 16
}
```
*Note: Valid formats are `single_elimination`, `double_elimination`, `round_robin`, `swiss`, `free_for_all`.*

---

### 👤 Users

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/users/me` | Get your profile |
| `PATCH` | `/users/me` | Update your profile |
| `GET` | `/users/:id` | Get user by UUID |

#### Request Body Example (Update):
```json
{
  "displayName": "Pro Gamer",
  "avatar": "https://example.com/avatar.png"
}
```

---

### ⚙️ Settings

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/settings` | Get your settings |
| `PATCH` | `/settings` | Update settings |
| `POST` | `/settings/reset` | Reset to defaults |

#### Request Body Example (Partial Update):
```json
{
  "theme": "dracula",
  "fontSize": 1.2,
  "themeHue": 200
}
```

---

### 🎮 Game Profiles

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/game-profiles` | Create game profile |
| `GET` | `/game-profiles` | Get your game profiles |
| `PATCH` | `/game-profiles/:game`| Update game profile |
| `DELETE` | `/game-profiles/:game`| Delete game profile |
| `GET` | `/users/:userId/game-profiles` | Get public profiles for user |

#### Request Body Example (Create):
```json
{
  "game": "league_of_legends",
  "gameIdentifier": "SummonerName#EUW",
  "metadata": {
    "preferredRole": "Mid"
  }
}
```
*Supported Games: `league_of_legends`, `cs2`, `valorant`, `dota2`, `overwatch2`*

---

## 💡 Pro Tips

1. **Validation Errors**: If you get a 400 error, check the response body for detailed Zod validation issues.
2. **Cookies**: Postman handles `HttpOnly` cookies automatically. The `refresh_token` will be stored and sent back to `/auth/refresh` without extra config.
3. **UUIDs**: Make sure to use valid UUID strings for IDs like `organizationId` or `userId`.
