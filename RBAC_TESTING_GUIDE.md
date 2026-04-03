# RBAC and Organization Testing Guide

This guide focuses on testing the Role-Based Access Control (RBAC) and Organization management systems to ensure your backend is "bulletproof".

---

## 🛠️ Environment Setup
Ensure you have two users registered in your Postman environment (User A and User B) to test cross-user permissions.
- `accessTokenA`: Token for the Organization Owner (User A).
- `accessTokenB`: Token for a regular user (User B).

---

## 🏢 Organization Creation (Fortified)

### 1. Successful Creation (Atomic)
- **Method**: `POST`
- **Path**: `/api/organizations`
- **Auth**: Bearer `accessTokenA`
- **Body**:
```json
{
  "name": "Transcendence University",
  "slug": "um6p-esports",
  "description": "The official esports organization for UM6P"
}
```
**Expected**: `201 Created`. This creates the organization AND makes User A the 'owner' in one transaction.

### 2. Duplicate Slug (Conflict Handling)
- **Body**: Same as above (send it twice).
**Expected**: `409 Conflict` with message: `"An organization with this slug already exists."`

---

## 👥 Member Management

### 3. Add Member (Admin/Owner Only)
- **Method**: `POST`
- **Path**: `/api/organizations/:id/members`
- **Auth**: Bearer `accessTokenA`
- **Body**:
```json
{
  "email": "userB@example.com",
  "role": "admin"
}
```
**Expected**: `201 Created`. User B is now an admin.

### 4. Unauthorized Add (Regular User)
- **Auth**: Bearer `accessTokenB` (Try it as a different user who isn't owner/admin)
**Expected**: `403 Forbidden`.

### 5. Update Member Role (Owner Only)
- **Method**: `PATCH`
- **Path**: `/api/organizations/:id/members/:userB_id`
- **Auth**: Bearer `accessTokenA`
- **Body**: `{ "role": "member" }`
**Expected**: `200 OK`.

### 6. Prevent Self-Demotion (Safety Catch)
- **Method**: `PATCH`
- **Path**: `/api/organizations/:id/members/:userA_id`
- **Auth**: Bearer `accessTokenA`
- **Body**: `{ "role": "member" }`
**Expected**: `403 Forbidden` with message: `"Owners cannot demote themselves..."`

---

## 🏆 Tournament RBAC

### 7. Authorized Creation (Owner/Admin)
- **Method**: `POST`
- **Path**: `/api/tournaments`
- **Auth**: Bearer `accessTokenA`
- **Body**:
```json
{
  "organizationId": "ORG_UUID",
  "sportId": "SPORT_UUID",
  "name": "University Finals",
  "description": "The big game",
  "format": "single_elimination",
  "maxParticipants": 16
}
```
**Expected**: `201 Created`.

### 8. Unauthorized Creation
- **Auth**: Bearer a token of a user who is NOT an admin/owner of that organization.
**Expected**: `403 Forbidden` with message: `"Insufficient permissions. Requires one of: owner, admin."`

---

## 💡 Troubleshooting
1. **IDs**: Get the `id` of the organization from the response of step 1.
2. **Emails**: Make sure `userB@example.com` exists in your database (register them first).
3. **UUIDs**: Use valid UUID strings for all ID parameters.
