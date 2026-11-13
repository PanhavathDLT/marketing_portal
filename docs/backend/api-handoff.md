# Marketing Backend — Frontend / Mobile API Handoff

> **Base URL:** `http://localhost:3000/api/v1` (development)
> **Updated:** 2026-11-13
> **Stack:** Express · TypeScript · Prisma 7 · PostgreSQL

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Auth Endpoints](#3-auth-endpoints)
4. [Customer — Reward & Points](#4-customer--reward--points)
5. [Customer — Daily Check-in](#5-customer--daily-check-in)
6. [Customer — Missions](#6-customer--missions)
7. [Customer — Reward Store](#7-customer--reward-store)
8. [Customer — Referral](#8-customer--referral)
9. [Customer — Campaigns](#9-customer--campaigns)
10. [Admin — Campaigns & Missions](#10-admin--campaigns--missions)
11. [Admin — Analytics](#11-admin--analytics)
12. [Error Reference](#12-error-reference)
13. [Enums Reference](#13-enums-reference)

---

## 1. Conventions

### Response envelope

Every response — success or error — is wrapped in a consistent envelope.

**Success**
```json
{ "status": "success", "data": { ... } }
```
For list endpoints, `data` is a JSON array:
```json
{ "status": "success", "data": [ ... ] }
```

**Error**
```json
{ "status": "error", "error": "Human-readable message" }
```

### Dates

All timestamps are **ISO-8601 with timezone**, e.g. `"2026-11-13T07:44:00.000Z"`.  
The backend uses `Asia/Phnom_Penh` as the timezone for day-boundary logic (check-in).

### IDs

All IDs are **integers**.

### POST responses

After any mutating POST (check-in, claim, redeem), the app should **re-fetch** the
relevant GET endpoint to reflect the new state. POST bodies return an empty `data: {}`.

### Content-Type

All requests with a body must send `Content-Type: application/json`.

---

## 2. Authentication

The API uses **JWT Bearer tokens**. Tokens are issued on login/register.

### Token types

| Token | Header | Lifetime | Use |
|---|---|---|---|
| `accessToken` | `Authorization: Bearer <token>` | 1 hour | All protected endpoints |
| `refreshToken` | Body of `/auth/refresh` | 7 days | Obtain a new access token |

### JWT payload

```json
{ "id": 1, "role": "CUSTOMER" }
```

`role` is either `"CUSTOMER"` or `"ADMIN"`.

### Sending the access token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token expiry flow

1. Request fails with `401 Unauthorized`
2. Call `POST /auth/refresh` with the stored `refreshToken`
3. Store the new `accessToken` (and `refreshToken`)
4. Retry the original request

---

## 3. Auth Endpoints

All auth endpoints are **public** — no token required.

---

### `POST /auth/register`

Create a new customer account.

**Request body**
```json
{
  "name": "Dara Chan",
  "email": "dara@example.com",
  "password": "secret123",
  "phone": "0123456789",
  "referralCode": "LL7K2Q"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `email` | string (email) | Yes | Must be unique |
| `password` | string | Yes | Min 8 characters |
| `phone` | string | No | Must be unique if provided |
| `referralCode` | string | No | Invalid codes are silently ignored — registration always succeeds |

**Success `201`**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "dara@example.com",
      "name": "Dara Chan",
      "role": "CUSTOMER",
      "tier": "BRONZE",
      "points": 0
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors**

| Status | Message |
|---|---|
| `409` | Email already in use |
| `422` | Validation error (missing/invalid fields) |

---

### `POST /auth/login`

**Request body**
```json
{
  "email": "dara@example.com",
  "password": "secret123"
}
```

**Success `200`**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "dara@example.com",
      "name": "Dara Chan",
      "role": "CUSTOMER",
      "tier": "BRONZE",
      "points": 165
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors**

| Status | Message |
|---|---|
| `401` | Invalid email or password |

---

### `POST /auth/refresh`

Exchange a refresh token for a new token pair.

**Request body**
```json
{ "refreshToken": "eyJ..." }
```

**Success `200`**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors**

| Status | Message |
|---|---|
| `401` | Invalid or expired refresh token |

---

## 4. Customer — Reward & Points

> All `/customer/*` endpoints require `Authorization: Bearer <accessToken>`.

---

### `GET /customer/reward/points`

Membership card data — balance, tier, progress toward next tier.

**Success `200`**
```json
{
  "status": "success",
  "data": {
    "points": 165,
    "tier": "BRONZE",
    "tierName": "Bronze",
    "nextTierName": "Silver",
    "pointsToNextTier": 35,
    "progress": 0.825
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `points` | int | Current spendable balance |
| `tier` | enum | Fixed code — use to pick card colour. See [Enums](#13-enums-reference) |
| `tierName` | string | Display text |
| `nextTierName` | string \| null | `null` when on the top tier (DIAMOND) |
| `pointsToNextTier` | int | `0` on the top tier |
| `progress` | number 0–1 | Gauge fill toward the next tier |

**Tier thresholds**

| Tier | Min points |
|---|---|
| BRONZE | 0 |
| SILVER | 200 |
| GOLD | 500 |
| PLATINUM | 1000 |
| DIAMOND | 2000 |

---

### `GET /customer/reward/points/history`

All points changes, newest first. Redemptions are **negative**.

**Success `200`**
```json
{
  "status": "success",
  "data": [
    {
      "id": 12,
      "source": "REDEEM",
      "missionType": null,
      "title": "Hat",
      "points": -200,
      "createdAt": "2026-11-11T07:44:00.000Z"
    },
    {
      "id": 11,
      "source": "MISSION",
      "missionType": "FIRST_LOAN_APPLICATION",
      "title": "Submit Your First Loan Application",
      "points": 100,
      "createdAt": "2026-11-10T03:10:00.000Z"
    },
    {
      "id": 10,
      "source": "CHECK_IN",
      "missionType": null,
      "title": "Daily check-in",
      "points": 20,
      "createdAt": "2026-11-09T01:02:00.000Z"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `source` | `MISSION` \| `CHECK_IN` \| `REDEEM` \| `REFERRAL` \| `EXPIRE` | |
| `missionType` | string \| null | Only set when `source = MISSION` |
| `points` | int | Signed — positive = earned, negative = spent |

---

## 5. Customer — Daily Check-in

---

### `GET /customer/reward/check-in`

Returns the full 7-day streak strip plus today's state.

**Success `200`**
```json
{
  "status": "success",
  "data": {
    "streakDays": 3,
    "canCheckInToday": true,
    "nextResetAt": "2026-11-13T17:00:00.000Z",
    "days": [
      { "day": 1, "points": 20, "isChecked": true,  "isToday": false },
      { "day": 2, "points": 20, "isChecked": true,  "isToday": false },
      { "day": 3, "points": 20, "isChecked": true,  "isToday": false },
      { "day": 4, "points": 20, "isChecked": false, "isToday": true  },
      { "day": 5, "points": 20, "isChecked": false, "isToday": false },
      { "day": 6, "points": 20, "isChecked": false, "isToday": false },
      { "day": 7, "points": 60, "isChecked": false, "isToday": false }
    ]
  }
}
```

| Field | Notes |
|---|---|
| `streakDays` | "You've checked in for N day(s)" |
| `canCheckInToday` | Drives the button enabled/disabled state |
| `nextResetAt` | Countdown target — re-fetch this endpoint when the timer hits zero |
| `days[].isToday` | Exactly one tile has `isToday: true` |
| `days[].isChecked` | All days up to current streak are checked |

**Streak rules (server-owned)**

- One check-in per calendar day (midnight `Asia/Phnom_Penh`)
- Missing a day resets the streak to Day 1
- After Day 7 the cycle resets to Day 1 on the next day
- Day 7 earns 60 pts; all other days earn 20 pts

---

### `POST /customer/reward/check-in`

Tap the "Check In" button.

**Request body** — none

**Success `200`**
```json
{ "status": "success", "data": {} }
```
Re-fetch `GET /reward/check-in` and `GET /reward/points` after this call.

**Errors**

| Status | Message |
|---|---|
| `409` | You have already checked in today. |

---

## 6. Customer — Missions

---

### `GET /customer/reward/missions`

All missions from active campaigns, with per-customer progress status.

**Success `200`**
```json
{
  "status": "success",
  "data": [
    { "id": 1, "type": "REFERRAL",               "title": "Invite a Friend to Apply",           "points": 100, "status": "IN_PROGRESS", "iconUrl": null },
    { "id": 2, "type": "FIRST_LOAN_APPLICATION", "title": "Submit Your First Loan Application", "points": 100, "status": "CLAIMABLE",   "iconUrl": null },
    { "id": 3, "type": "FIRST_LOAN_APPROVAL",    "title": "Get Your First Loan Approved",       "points": 100, "status": "IN_PROGRESS", "iconUrl": null },
    { "id": 4, "type": "FIRST_REPAYMENT",        "title": "Make Your First Repayment",          "points": 100, "status": "CLAIMED",     "iconUrl": null }
  ]
}
```

| `status` | Button shown |
|---|---|
| `IN_PROGRESS` | "Let's go!" — navigate to the relevant screen |
| `CLAIMABLE` | "Claim" — call `POST /missions/:id/claim` |
| `CLAIMED` | Disabled "Claimed" |

| `type` | "Let's go!" destination |
|---|---|
| `REFERRAL` | Invite / QR sheet |
| `FIRST_LOAN_APPLICATION` | Request-loan page |
| `FIRST_LOAN_APPROVAL` | Home (loan status card) |
| `FIRST_REPAYMENT` | Repayment page |

Unknown types should be hidden — do not crash on new types added server-side.

---

### `POST /customer/reward/missions/:missionId/claim`

Claim points for a completed mission.

**Request body** — none

**Success `200`**
```json
{ "status": "success", "data": {} }
```
Re-fetch `GET /reward/missions` and `GET /reward/points` after this call.

**Errors**

| Status | Message |
|---|---|
| `404` | Mission not found |
| `409` | Mission is not claimable |

---

## 7. Customer — Reward Store

---

### `GET /customer/reward/store`

All items currently available for redemption (in stock, active).

**Success `200`**
```json
{
  "status": "success",
  "data": [
    { "id": 101, "title": "Hat",        "points": 200, "imageUrl": "https://cdn.example.com/rewards/hat.png" },
    { "id": 102, "title": "Polo Shirt", "points": 200, "imageUrl": "https://cdn.example.com/rewards/polo.png" }
  ]
}
```

---

### `GET /customer/reward/my-rewards`

The customer's past redemptions, newest first.

**Success `200`**
```json
{
  "status": "success",
  "data": [
    {
      "id": 55,
      "title": "Hat",
      "points": 200,
      "imageUrl": "https://cdn.example.com/rewards/hat.png",
      "status": "PENDING_PICKUP",
      "redeemedAt": "2026-11-11T07:44:00.000Z"
    }
  ]
}
```

| `status` | Meaning |
|---|---|
| `PENDING_PICKUP` | Awaiting collection |
| `COLLECTED` | Picked up |
| `EXPIRED` | Not collected in time |

> `id` is the **redemption** ID, not the store item ID.

---

### `POST /customer/reward/store/:rewardId/redeem`

Redeem a reward. Called after the customer accepts the Terms sheet.

**Request body** — none

**Optional header for idempotency** (recommended — prevents double-submit on timeout retry):
```
Idempotency-Key: <uuid-or-unique-string>
```

**Success `200`**
```json
{ "status": "success", "data": {} }
```
Re-fetch `GET /reward/my-rewards` and `GET /reward/points` after this call.

**Errors**

| Status | Message |
|---|---|
| `404` | Reward not found |
| `409` | Reward is out of stock |
| `422` | You do not have enough points for this reward. |

---

## 8. Customer — Referral

---

### `GET /customer/referral/my-code`

The referrer's own code — used to generate the QR shown to friends.

**Success `200`**
```json
{
  "status": "success",
  "data": { "code": "LL7K2Q" }
}
```

The QR content should be:
```
https://play.google.com/store/apps/details?id=<app-id>&referrer=ref%3D<code>
```

The code is **permanent** — the same code is returned every time, so saved/printed QRs stay valid.

---

### `POST /customer/referral/apply`

The referee submits a referrer's code after registering (the fallback for users who skipped it at registration).

**Request body**
```json
{ "code": "LL7K2Q" }
```

**Success `200`**
```json
{
  "status": "success",
  "data": { "referrerName": "Dara Chan" }
}
```
Show: `"Invited by {referrerName}"`.

**Errors**

| Status | Message |
|---|---|
| `404` | Referral code not found. |
| `409` | You are already linked to a referrer. |
| `422` | You cannot use your own referral code. |

---

## 9. Customer — Campaigns

Read-only access to active campaigns and their missions.

---

### `GET /customer/campaigns`

**Success `200`**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "November Promo",
      "description": "Complete missions to earn extra points",
      "status": "ACTIVE",
      "startDate": "2026-11-01T00:00:00.000Z",
      "endDate": "2026-11-30T23:59:59.000Z",
      "missions": [
        { "id": 1, "type": "REFERRAL", "title": "Invite a Friend", "points": 100, "iconUrl": null }
      ]
    }
  ]
}
```

---

### `GET /customer/campaigns/:id`

Returns a single active campaign with its missions.

---

## 10. Admin — Campaigns & Missions

> All `/admin/*` endpoints require a JWT token with `role: "ADMIN"`.

---

### Campaigns CRUD

| Method | Path | Action |
|---|---|---|
| `GET` | `/admin/campaigns` | List all campaigns (all statuses) |
| `GET` | `/admin/campaigns/:id` | Get one campaign with missions |
| `POST` | `/admin/campaigns` | Create campaign |
| `PATCH` | `/admin/campaigns/:id` | Update campaign (partial) |
| `DELETE` | `/admin/campaigns/:id` | Delete campaign |

**Create / Update body**
```json
{
  "title": "November Promo",
  "description": "Complete missions to earn points",
  "status": "ACTIVE",
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": "2026-11-30T23:59:59.000Z"
}
```

| Field | PATCH required? | Notes |
|---|---|---|
| `title` | No | |
| `description` | No | |
| `status` | No (PATCH only) | `DRAFT` \| `ACTIVE` \| `INACTIVE` |
| `startDate` | No | ISO-8601 datetime string |
| `endDate` | No | ISO-8601 datetime string |

---

### Missions CRUD (nested under campaign)

| Method | Path | Action |
|---|---|---|
| `GET` | `/admin/campaigns/:campaignId/missions` | List missions for a campaign |
| `POST` | `/admin/campaigns/:campaignId/missions` | Add a mission to a campaign |
| `PATCH` | `/admin/campaigns/:campaignId/missions/:id` | Update a mission |
| `DELETE` | `/admin/campaigns/:campaignId/missions/:id` | Delete a mission |

**Create body**
```json
{
  "campaignId": 1,
  "type": "REFERRAL",
  "title": "Invite a Friend to Apply",
  "points": 100,
  "iconUrl": "https://cdn.example.com/icons/referral.png"
}
```

| Field | Required | Notes |
|---|---|---|
| `campaignId` | Yes | Must match the `:campaignId` in the path |
| `type` | Yes | `REFERRAL` \| `FIRST_LOAN_APPLICATION` \| `FIRST_LOAN_APPROVAL` \| `FIRST_REPAYMENT` |
| `title` | Yes | Display text |
| `points` | Yes | Positive integer |
| `iconUrl` | No | Full `https://` URL |

---

## 11. Admin — Analytics

---

### `GET /admin/analytics/overview`

**Success `200`**
```json
{
  "status": "success",
  "data": {
    "totalCustomers": 540,
    "totalCampaigns": 3,
    "totalRedemptions": 92,
    "totalPointsIssued": 48200
  }
}
```

---

### `GET /admin/analytics/campaigns/:campaignId`

```json
{
  "status": "success",
  "data": {
    "campaign": { "id": 1, "title": "November Promo", "status": "ACTIVE", "..." },
    "totalParticipants": 210,
    "totalClaimedMissions": 87
  }
}
```

---

### `GET /admin/analytics/check-ins`

```json
{
  "status": "success",
  "data": {
    "totalToday": 134,
    "totalAllTime": 4820
  }
}
```

---

## 12. Error Reference

All errors follow:
```json
{ "status": "error", "error": "Human-readable message" }
```

| HTTP Status | When |
|---|---|
| `400` | Generic bad request |
| `401` | Missing, invalid, or expired token |
| `403` | Authenticated but not authorized (wrong role) |
| `404` | Resource not found |
| `409` | Conflict (duplicate check-in, already linked referrer, out of stock) |
| `422` | Validation failed (missing required field, insufficient points, own referral code) |
| `500` | Unexpected server error |

**401 on protected endpoints** — the `Authorization` header is missing or the token is expired. Refresh using `POST /auth/refresh`.

---

## 13. Enums Reference

### `Role`
| Value | Description |
|---|---|
| `CUSTOMER` | Mobile app user |
| `ADMIN` | Dashboard / internal staff |

### `Tier`
| Value | Min points |
|---|---|
| `BRONZE` | 0 |
| `SILVER` | 200 |
| `GOLD` | 500 |
| `PLATINUM` | 1000 |
| `DIAMOND` | 2000 |

### `MissionType`
| Value | Trigger |
|---|---|
| `REFERRAL` | Referred friend makes first loan |
| `FIRST_LOAN_APPLICATION` | Customer submits first loan application |
| `FIRST_LOAN_APPROVAL` | Customer's first loan is approved |
| `FIRST_REPAYMENT` | Customer makes first repayment |

### `MissionStatus`
| Value | Meaning |
|---|---|
| `IN_PROGRESS` | Not yet completed |
| `CLAIMABLE` | Completed, points not yet collected |
| `CLAIMED` | Points collected |

### `PointsSource`
| Value | Sign of `points` |
|---|---|
| `MISSION` | Positive |
| `CHECK_IN` | Positive |
| `REFERRAL` | Positive |
| `REDEEM` | **Negative** |
| `EXPIRE` | **Negative** |

### `RedemptionStatus`
| Value | Meaning |
|---|---|
| `PENDING_PICKUP` | Awaiting collection at branch |
| `COLLECTED` | Picked up |
| `EXPIRED` | Not collected in time |

### `CampaignStatus`
| Value | Visible to customer? |
|---|---|
| `DRAFT` | No |
| `ACTIVE` | Yes |
| `INACTIVE` | No |
