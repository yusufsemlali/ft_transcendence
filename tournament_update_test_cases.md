# 🛡️ Tournament Update: Edge Case Test Protocol

This guide outlines exactly how to test the **State Machine** and **Policy Layer** for your tournament update flow. Use these cases in Postman to ensure your "Big Tech" architecture is working as intended.

---

### 🔑 Prerequisites
1. **Login** to get a Bearer Token.
2. **Current Org ID**: An organization you OWN.
3. **Draft Tournament ID**: A tournament in `draft` status.
4. **Live Tournament ID**: A tournament in `ongoing` status (You may need to manually update the DB status for this one to test).

---

### Case 1: Unauthorized 🚫
**Scenario:** An unauthenticated user tries to update a name.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:id`
- **Body:** `{ "name": "Hacked Name" }`
- **Expected:** `401 Unauthorized`

---

### Case 2: Forbidden (Cross-Org Injection) 🔒
**Scenario:** User is logged in but tries to update a tournament that belongs to a **different organization** they don't own.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:victim_id`
- **Body:** `{ "name": "Takeover" }`
- **Expected:** `403 Forbidden` (Our RBAC controller checks ownership)

---

### Case 3: Structural Lock (State Machine Test) ⚙️
**Scenario:** TO tries to pivot from **Swiss** to **Single Elimination** while the tournament is already **Ongoing**.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:live_id`
- **Body:** `{ "bracketType": "single_elimination" }`
- **Expected:** `403 Forbidden`
- **Error Content:** `"Illegal State Transition: Cannot modify bracketType once the tournament is live or completed."`

---

### Case 4: Cosmetic Change (Always Allowed) ✅
**Scenario:** TO updates the description of a live tournament.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:any_id`
- **Body:** `{ "description": "Updated event description for sponsors." }`
- **Expected:** `200 OK`

---

### Case 5: Toggling Privacy 🕵️
**Scenario:** TO makes a public tournament private after it's been created.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:id`
- **Body:** `{ "isPrivate": true }`
- **Expected:** `200 OK`
- **Verification:** Run `GET /api/tournaments` (the global discovery). This tournament should now be missing from the results!

---

### Case 6: Capacity Floor Check 📉
**Scenario:** TO tries to set a limit of 1 person.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:id`
- **Body:** `{ "maxParticipants": 1 }`
- **Expected:** `400 Bad Request`
- **Error Content:** `"Maximum participants cannot be less than 2."`

---

### Case 7: Data Loss Prevention (Future Ready) 🚧
**Scenario:** TO tries to lower capacity to 10 when 15 people are already registered.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:id`
- **Body:** `{ "maxParticipants": 10 }`
- **Expected:** `409 Conflict` (or 400 depending on policy choice)
- **Note:** This requires the participants logic to be fully live to fetch counts.

---

### Case 8: Slug Collision Conflict 💥
**Scenario:** TO renames "Tournament A" to "Tournament B", but "Tournament B" already exists in their org.
- **Method:** `PATCH`
- **Endpoint:** `/api/tournaments/:id`
- **Body:** `{ "name": "Existing Tournament Name" }`
- **Expected:** `409 Conflict`
- **Error Content:** `"A tournament conflict occurred (duplicate name or slug)."`

