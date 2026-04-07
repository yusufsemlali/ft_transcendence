# Friends List Retrieval API

## Overview
This API provides endpoints to retrieve the authenticated user's friends list along with relationship statuses (pending, accepted, blocked). It supports the frontend friends panel and social features.

## Base URL
```
https://localhost:8080/api
```

## Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

---

## Endpoints

### 1. GET `/friends` — Get My Friends List

Retrieves the authenticated user's friends list with relationship statuses.

#### Query Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `status`  | string | No       | Filter by relationship status: `pending`, `accepted`, or `blocked` |

#### Responses

**200 OK** — Returns an array of friends:
```json
[
  {
    "id": "uuid-of-friend",
    "username": "player42",
    "displayName": "Player 42",
    "avatar": "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    "isOnline": true,
    "status": "accepted",
    "friendshipId": "uuid-of-friendship-record",
    "since": "2025-03-15T10:30:00.000Z"
  }
]
```

**401 Unauthorized** — Missing or invalid token:
```json
{
  "message": "Unauthorized"
}
```

#### Examples

**Get all friends:**
```
GET /api/friends
```

**Get only accepted friends:**
```
GET /api/friends?status=accepted
```

**Get pending friend requests:**
```
GET /api/friends?status=pending
```

**Get blocked users:**
```
GET /api/friends?status=blocked
```

---

### 2. GET `/friends/:userId` — Get Friendship with Specific User

Returns the friendship status between the authenticated user and the specified user.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId`  | UUID | Yes      | The UUID of the target user |

#### Responses

**200 OK** — Returns the friendship details:
```json
{
  "id": "uuid-of-friend",
  "username": "player42",
  "displayName": "Player 42",
  "avatar": "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  "isOnline": false,
  "status": "pending",
  "friendshipId": "uuid-of-friendship-record",
  "since": "2025-03-15T10:30:00.000Z"
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "message": "No friendship found with this user"
}
```

---

## Data Model

### Friend Object

| Field          | Type    | Description |
|----------------|---------|-------------|
| `id`           | UUID    | The friend's user ID |
| `username`     | string  | The friend's username |
| `displayName`  | string? | The friend's display name (nullable) |
| `avatar`       | string  | URL to the friend's avatar image |
| `isOnline`     | boolean | Whether the friend is currently online |
| `status`       | enum    | Relationship status: `pending`, `accepted`, or `blocked` |
| `friendshipId` | UUID    | The ID of the friendship record |
| `since`        | date    | When the friendship was created |

### Friendship Status Enum

| Value      | Description |
|------------|-------------|
| `pending`  | Friend request sent but not yet accepted |
| `accepted` | Both users are friends |
| `blocked`  | One user has blocked the other |

---

## Database Schema

The `friendships` table stores all relationships:

| Column      | Type      | Description |
|-------------|-----------|-------------|
| `id`        | UUID (PK) | Auto-generated |
| `sender_id` | UUID (FK) | References `users.id` |
| `receiver_id`| UUID (FK)| References `users.id` |
| `status`    | enum      | `pending`, `accepted`, `blocked` |
| `created_at`| timestamp | Auto-set on creation |

Unique constraint on `(sender_id, receiver_id)` prevents duplicate friendships.
