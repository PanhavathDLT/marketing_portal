# Rewards & Missions — Backend API Requirements

> **Created:** Wednesday, November 11, 2026 — 14:51
> **Updated:** Wednesday, November 11, 2026 — 18:07 (check-in: configurable cycle length, storage recap, backend/mobile responsibility split)
> **Author:** claude code
> **Scope:** What the mobile app needs from the backend to switch the Rewards feature (points, daily check-in, missions, reward store, redeem, points history) from mock data to a real API, plus the phase 1 referral endpoints.

---

## 1. Summary

The Rewards screens are built and work end to end in the app, using **mock data** (`RewardMockDatasource`). To go live, the app needs **9 reward endpoints** and **2 referral endpoints**:

| # | Method | Path (proposed) | Used for |
|---|---|---|---|
| 1 | GET | `/api/v1/customer/reward/points` | Membership card: balance, tier, progress |
| 2 | GET | `/api/v1/customer/reward/points/history` | Points history screen |
| 3 | GET | `/api/v1/customer/reward/check-in` | 7-day check-in row + countdown |
| 4 | POST | `/api/v1/customer/reward/check-in` | "Check in" button |
| 5 | GET | `/api/v1/customer/reward/missions` | Daily Missions list |
| 6 | POST | `/api/v1/customer/reward/missions/{missionId}/claim` | Mission "Claim" button |
| 7 | GET | `/api/v1/customer/reward/store` | Reward Store tab |
| 8 | GET | `/api/v1/customer/reward/my-rewards` | My Reward tab |
| 9 | POST | `/api/v1/customer/reward/store/{rewardId}/redeem` | "Book Now" on Redeem Detail |
| 10 | GET | `/api/v1/customer/referral/my-code` | Referrer's own code, shown in their QR (§8) |
| 11 | POST | `/api/v1/customer/referral/apply` | Referee submits a scanned or typed code after registering (§8) |

Plus one existing endpoint: `POST /auth/register` already accepts `referralCode` (§8.3).

The paths are **proposals**. Rename them freely; the app changes one constant per path (`ApiConfig`, "Reward / Missions" block). The field names and value shapes below are what the app parses today, so keeping them saves a remapping step.

**Priority for the first production release:** daily check-in (3, 4) and redeem (7, 8, 9), plus points (1) and history (2), which both screens depend on. Missions (5, 6) can follow; the app hides unknown or empty missions safely.

---

## 2. Conventions (same as existing endpoints)

- **Auth:** all endpoints are per customer, authenticated with the existing Bearer token.
- **Success envelope:** the app reads `data`:
  ```json
  { "status": "success", "data": { ... } }
  ```
  For list endpoints, `data` is a **JSON array**.
- **Errors:** use a non-2xx status. The app shows the response body's `error` field to the user, falling back to `message`, so it must be **user-readable**. See [Open questions](#7-open-questions) about Khmer/English.
- **Dates:** ISO-8601 with timezone, e.g. `2026-11-11T07:44:00Z`. The app converts to local time.
- **IDs:** integers.
- **Re-fetch model:** after any POST (check-in, claim, redeem), the app **re-fetches** the affected GET endpoints. POST responses can therefore be an empty `data` (`{}`); a body is optional and ignored.
- **Enum values:** UPPER_SNAKE_CASE strings. The app tolerates unknown values: unknown mission types are hidden, and unknown statuses are treated as "in progress".

---

## 3. Points

### 3.1 `GET /reward/points`

Drives the membership card ("My Points 165", "Bronze", gauge "82%", "35 more points to reach Gold").

```json
{
  "status": "success",
  "data": {
    "points": 165,
    "tier": "BRONZE",
    "tierName": "Bronze",
    "nextTierName": "Gold",
    "pointsToNextTier": 35,
    "progress": 0.825
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `points` | int | Current spendable balance |
| `tier` | `BRONZE` \| `SILVER` \| `GOLD` \| `PLATINUM` \| `DIAMOND` | **Fixed code** the app uses to choose the card colour and membership benefits. It never changes wording. Level list to confirm (§7 Q3). |
| `tierName` | string | **Display text**, shown as-is on the card. The backend can reword or translate it freely. |
| `nextTierName` | string \| null | `null` when the user is on the top tier ("You've reached the highest tier") |
| `pointsToNextTier` | int | `0` on the top tier |
| `progress` | number 0–1 | Gauge fill toward the next tier. **Backend calculates it**; tier thresholds are business rules. |

### 3.2 `GET /reward/points/history`

Every points change, **newest first**. Redemptions are **negative**.

```json
{
  "status": "success",
  "data": [
    { "id": 12, "source": "REDEEM",   "missionType": null,                     "title": "Hat",                                "points": -200, "createdAt": "2026-11-11T07:44:00Z" },
    { "id": 11, "source": "MISSION",  "missionType": "FIRST_LOAN_APPLICATION", "title": "Submit Your First Loan Application", "points": 100,  "createdAt": "2026-11-10T03:10:00Z" },
    { "id": 10, "source": "CHECK_IN", "missionType": null,                     "title": "Daily check-in",                     "points": 20,   "createdAt": "2026-11-09T01:02:00Z" }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `source` | `MISSION` \| `CHECK_IN` \| `REDEEM` | The app builds a localized row title from this |
| `missionType` | string \| null | Required when `source = MISSION` (see §5) |
| `title` | string | For `REDEEM`, the **reward name** (shown as "Redeemed: Hat"). For other sources it is a fallback only. |
| `points` | int | **Signed**: positive when earned, negative when spent |
| `createdAt` | datetime | |

**Requirement:** `points` (§3.1) must always equal the sum of history `points`. Write the balance change and the history row in the **same transaction**.

**Pagination:** not needed for v1. If you add it, propose a format and we'll adapt.

---

## 4. Daily check-in

### 4.1 `GET /reward/check-in`

```json
{
  "status": "success",
  "data": {
    "streakDays": 3,
    "canCheckInToday": true,
    "nextResetAt": "2026-11-11T17:00:00Z",
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

| Field | Type | Notes |
|---|---|---|
| `streakDays` | int | "You've checked in for **N** Day" |
| `canCheckInToday` | bool | Enables or disables the Check in button. **Server decides.** |
| `nextResetAt` | datetime | End of the current check-in day; the app counts down to it. At zero the app re-fetches this endpoint. |
| `days[]` | array (one item per cycle day; 7 today) | Rendered exactly as sent. Per-day points can vary (day 7 = 60 in the design). The length comes from config (§4.4), not a fixed 7. |
| `days[].isToday` | bool | The tile the button acts on |

### 4.2 `POST /reward/check-in`

- No request body.
- **Success:** `200`. Adds the day's points, adds a `CHECK_IN` history row, and advances the streak.
- **Already checked in today:** `409`, with `error`: "You have already checked in today."

### 4.3 Streak rules (backend owns these)

| Rule | Decision |
|---|---|
| Check-ins per day | **One** per calendar day |
| Day boundary | Midnight `Asia/Phnom_Penh` (00:00 local = 17:00Z). `nextResetAt` is the next midnight. *(Proposed; confirm, §7 Q2.)* |
| **Missed a day** | ✅ **Decided:** the streak **resets to Day 1 automatically**. The next check-in counts as Day 1 and earns Day 1 points. |
| After Day 7 | *Proposed:* a new cycle starts at Day 1 the next day *(confirm, §7 Q2)* |
| Points per day | Day 1–6 = 20, Day 7 = 60. Keep it as backend config, e.g. `CHECK_IN_POINTS = [20, 20, 20, 20, 20, 20, 60]`. **The cycle length is the length of this list**, so a 10- or 30-day cycle is a config change (§4.4). |
| `streakDays` | Consecutive days checked in **within the current cycle**. `0` after a reset, before the next check-in. |

**"Reset automatically" means the GET already reflects it.** The app doesn't send a reset request. When a day is missed, the next `GET /reward/check-in` must return the reset state:
- `streakDays: 0`
- every `days[].isChecked: false`
- `days[0].isToday: true`
- `canCheckInToday: true`

**Example:**

| Date | Action | `GET` returns afterwards | Points |
|---|---|---|---|
| Mon | Check in | Day 1 ✓, `streakDays: 1` | +20 |
| Tue | Check in | Day 2 ✓, `streakDays: 2` | +20 |
| Wed | *(missed)* | — | — |
| Thu (before check-in) | Opens the app | All unchecked, `streakDays: 0`, Day 1 = today | — |
| Thu | Check in | Day 1 ✓, `streakDays: 1` | +20 |

The app renders whatever `days[]` and `streakDays` say, so the backend can change these rules without an app release.

### 4.4 Suggested implementation

**The concept in four lines:**
1. The customer's first check-in is **Day 1**.
2. Each following day they check in, they move up one day (Day 2, Day 3, …).
3. If they **skip a day**, the streak is broken, and their next check-in becomes **Day 1** again.
4. After the last day of the cycle, the next check-in starts a new **Day 1**.

```
Mon ✓ Day 1 · Tue ✓ Day 2 · Wed ✗ skipped · Thu ✓ Day 1 · Fri ✓ Day 2
```

The streak is **per customer**. There is no shared "Day 1": Day 1 is the customer's first check-in, or their first after a reset. When someone downloaded the app doesn't matter.

**Store per customer** (two fields are enough):

| Field | Type | Meaning |
|---|---|---|
| `last_check_in_date` | date (Phnom Penh), nullable | Last day they checked in. `null` = never. Tells whether the streak is alive (today or yesterday) or broken (older). |
| `current_streak_day` | int 0–`CYCLE_LENGTH` | Which day of the cycle that check-in was |

**No "first day" field is needed.** It can be worked out as `last_check_in_date − (current_streak_day − 1)`. Storing it would be a second copy that could disagree. Add one only if reporting needs it (e.g. "how long do streaks last").

**Check-in log table** (one row per check-in):

| Field | Purpose |
|---|---|
| `customer_id` + `check_in_date` (**unique together**) | Stops double check-ins from a double-tap or retry |
| `day` | Which cycle day it was |
| `points` | Points awarded. Feeds the `CHECK_IN` row in points history (§3.2). |

**Config, not hardcoded:**

```text
CHECK_IN_POINTS = [20, 20, 20, 20, 20, 20, 60]   # points per day; edit to change the rewards
CYCLE_LENGTH    = len(CHECK_IN_POINTS)           # 7 today; becomes 10 if the list has 10 items
```

**Shared rule, used by both GET and POST:**

```text
today = current date in Asia/Phnom_Penh

function resolve(customer):
    if last_check_in_date == null:            return { streak: 0, todayDay: 1, checkedToday: false }   # new customer
    if last_check_in_date == today:           return { streak: current_streak_day, todayDay: current_streak_day, checkedToday: true }
    if last_check_in_date == today - 1 day:
        if current_streak_day >= CYCLE_LENGTH: return { streak: 0, todayDay: 1, checkedToday: false }   # cycle finished → new cycle
        else:                                 return { streak: current_streak_day, todayDay: current_streak_day + 1, checkedToday: false }
    # 2+ days ago → missed a day
    return { streak: 0, todayDay: 1, checkedToday: false }                                              # reset
```

**`GET /reward/check-in`:** call `resolve`, then build the response:
- `streakDays` = `streak`
- `canCheckInToday` = `!checkedToday`
- `days[i]` (i = 1..`CYCLE_LENGTH`):
  - `isChecked = i <= streak`
  - `isToday = (i == todayDay)`
  - `points = CHECK_IN_POINTS[i]`
- `nextResetAt` = the next midnight Phnom Penh time, as UTC

**`POST /reward/check-in`:** in **one transaction**:
1. `r = resolve(customer)`. If `r.checkedToday`, return `409`.
2. Set `last_check_in_date = today` and `current_streak_day = r.todayDay`.
3. Insert the check-in log row. The unique key rejects a duplicate; return `409` in that case too.
4. Add `CHECK_IN_POINTS[r.todayDay]` points to the balance, and insert a `CHECK_IN` history row (§3.2).

**Notes:**
- **No midnight job is needed.** A reset is just the date comparison the next time the customer opens the screen, which is what "reset automatically" means.
- **Double-tap and retry safety:** the unique key on the check-in log (`customer_id`, `check_in_date`) means two simultaneous POSTs can't both succeed.
- **All state lives on the backend.** Reinstalling or switching phones shows the same streak.
- **Changing the cycle length:** edit `CHECK_IN_POINTS` only, since `days[].length` always equals `CHECK_IN_POINTS.length`. With `>=` in the new-cycle check, a customer on Day 9 of an old 10-day cycle simply starts a new cycle if the list shrinks to 7. Nobody gets stuck on a day that no longer exists.

### 4.5 Who does what

**The backend decides everything; the app only displays and sends the tap.**

| Backend | Mobile app |
|---|---|
| Works out which day it is and whether the streak is broken (`resolve`) | Draws one tile per item in `days[]` (label, points, ✓ or coin) and highlights `isToday` |
| Resets the streak (by date comparison, no job) | Shows "checked in for N Day" from `streakDays` |
| Decides points per day and cycle length (`CHECK_IN_POINTS`) | Enables or disables the button from `canCheckInToday` |
| Owns the timezone and day boundary; sends `nextResetAt` | Counts down to `nextResetAt`; at zero, re-fetches silently |
| Prevents double check-ins (unique key → `409`) | On tap: `POST`, then re-fetch check-in data and points; spinner + disabled button while busy |
| Writes balance + history in one transaction | Shows a success toast, or the backend's `error` / `message` |

The app **does not** calculate days, reset streaks, know points or cycle length, handle timezones, or store anything locally. So **any rule change (reset rule, points, cycle length) needs no app release.**

**One caveat on cycle length:** the app's layout fits about 7 tiles in one row. Up to about 9 still works, just tighter. A long cycle (e.g. 30 days) needs a small UI change (a scrolling row or grid), so tell the mobile team before changing it.

**Mobile status:** all of the above is already built (`checkin_strip.dart`, `RewardViewModel.checkIn()` / `refreshStreak()`), running on mock data until the endpoints exist.

---

## 5. Missions

### 5.1 `GET /reward/missions`

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

**`type`**: the app supports exactly these 4. It uses `type` to choose the "Let's go!" destination and the localized title.

| `type` | "Let's go!" opens | Backend marks it complete when… |
|---|---|---|
| `REFERRAL` | Invite / QR sheet | An invited friend makes their first loan (per the invite sheet text: "Earn 200pts for each referral when the referee makes their first Loan"). Points value to be confirmed in §7. |
| `FIRST_LOAN_APPLICATION` | Request-loan page | The customer's first loan application is submitted |
| `FIRST_LOAN_APPROVAL` | Home (loan status card) | The first loan is approved |
| `FIRST_REPAYMENT` | Repayment page | The first repayment succeeds |

Any other `type` is **hidden** by the current app version, so new types can be added server-side without breaking older apps.

**`status`**:

| `status` | Button shown |
|---|---|
| `IN_PROGRESS` | "Let's go!" |
| `CLAIMABLE` | "Claim" (completed; points not collected yet) |
| `CLAIMED` | disabled "Claimed" |

**Completion detection is fully server-side.** The app never reports "I did this mission"; the backend moves a mission from `IN_PROGRESS` to `CLAIMABLE` based on its own loan, repayment and referral events.

`iconUrl` is optional. It isn't displayed yet; the app shows a placeholder circle.

### 5.2 `POST /reward/missions/{missionId}/claim`

- No request body.
- **Success:** `200`. Adds the mission's points, adds a `MISSION` history row (with `missionType`), and sets the status to `CLAIMED`.
- **Not claimable yet or already claimed:** `409`.
- **Unknown mission:** `404`.

---

## 6. Reward store & redeem

### 6.1 `GET /reward/store`

```json
{
  "status": "success",
  "data": [
    { "id": 101, "title": "Hat",        "points": 200, "imageUrl": "https://cdn.example.com/rewards/hat.png" },
    { "id": 102, "title": "Polo Shirt", "points": 200, "imageUrl": "https://cdn.example.com/rewards/polo.png" }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | int | Used in the redeem path |
| `title` | string | Shown as-is; not localized by the app |
| `points` | int | Cost |
| `imageUrl` | string | Full `https://` URL. Transparent PNG preferred; it is shown on a white or light-grey card. |

Return only items that are **currently redeemable** (in stock and active).

### 6.2 `GET /reward/my-rewards`

The same item shape plus `redeemedAt`, newest first:

```json
{ "id": 55, "title": "Hat", "points": 200, "imageUrl": "https://…/hat.png", "redeemedAt": "2026-11-11T07:44:00Z" }
```

`id` here is the **redemption** id, not the store item id.

### 6.3 `POST /reward/store/{rewardId}/redeem`

Called when the user taps **Book Now** on the Redeem Detail page, after accepting the Terms sheet.

- No request body.
- **Success:** `200`. Deducts the points, adds a `REDEEM` history row with **negative** points and the reward name as `title`, and adds the item to My Reward.
- **Not enough points:** `422`, with `error`: "You do not have enough points for this reward."
- **Out of stock or inactive:** `409`.
- **Unknown reward:** `404`.

**Idempotency:** the app disables the button while the request runs, but a retry after a timeout could still double-submit. Please make redeem (and claim and check-in) safe to repeat, e.g. via an `Idempotency-Key` header that the app can send. Tell us if you want this.

---

## 7. Open questions

Please answer or decide these. They affect UI text or behaviour.

1. **Error language:** the app shows `error` / `message` verbatim. Should the backend return Khmer or English based on the app's `Accept-Language` header, or return an error **code** (e.g. `INSUFFICIENT_POINTS`) so the app can localize it?
2. **Check-in rules:** the missed-day behaviour is decided (reset to Day 1, §4.3). Still to confirm: the timezone (`Asia/Phnom_Penh`?) and the after-Day-7 behaviour (new cycle?).
3. **Tiers:** confirm the levels, lowest to highest: Bronze → Silver → Gold → Platinum → **Diamond**. What are each level's points thresholds, and do tiers ever go down?
4. **Points expiry:** do points expire? If so, we'll need an expiry date on the points response and possibly an `EXPIRE` history source.
5. **Pickup flow after Book Now:** the Terms say the reward must be collected within 24 hours at Kampus Building.
   - Should `my-rewards` include a pickup **status** (`PENDING_PICKUP`, `COLLECTED`, `EXPIRED`) and a deadline?
   - Are points refunded if the reward isn't collected?
6. **Pickup location:** the address and map link are currently fixed in the app. Should the store item (or a config endpoint) carry the pickup address and map URL, in case there will ever be more than one location?
7. **Terms text:** the 6 bullet points on the Terms sheet are currently fixed in the app. Should the backend serve them (per reward or global) so ops can edit them?
8. **Referral points value:** the invite sheet says 200 pts, but the mission shows +100 in the design. Which is correct, and should it come from the API?
9. **Referral reward trigger:** when does the referrer get points: when the referee registers, gets eKYC verified, applies for a loan, or gets a loan approved? (Business decision, §8.4.)

---

## 8. Referral — phase 1 (QR code, no branch.io)

**How it works for users:**
- **Referrer** (an existing customer, e.g. Dara) shows a QR containing their personal referral code.
- **Referee** (a new person, e.g. Sophea) enters that code, either:
  - **while registering**, typed into an optional "Referral code" field (§8.3), or
  - **after registering**, if she forgot: from the Home top bar, she scans Dara's QR or types the code (§8.2).

**QR content:** the store link with the code attached, e.g. `https://play.google.com/store/apps/details?id=com.delightech.luyleun&referrer=ref%3DLL7K2Q`.
- A phone camera opens the store.
- The in-app scanner reads the code (`LL7K2Q`) from the link **on the phone**, so no endpoint is needed to decode a QR.

**Out of scope for phase 1:** branch.io and deferred deep links, so the code isn't auto-filled after a fresh install, and "Share as Link".

### 8.1 `GET /api/v1/customer/referral/my-code` — new

Used by the **referrer** to show their QR.

```json
{ "status": "success", "data": { "code": "LL7K2Q" } }
```

Code requirements:
- **One per customer, permanent:** the same code every time, so saved or printed QRs keep working.
- **Short and random:** e.g. `LL7K2Q`. Not the phone number or internal ID, which would expose personal data in a QR anyone can scan and make codes guessable.
- **Unique:** exactly one owner per code.

### 8.2 `POST /api/v1/customer/referral/apply` — new

Used by the **referee** after registering, as the fallback for users who skipped the code at registration.

```json
// request
{ "code": "LL7K2Q" }
// success
{ "status": "success", "data": { "referrerName": "Dara" } }
```

The app shows success as "Invited by {referrerName}". It shows any error's `error` / `message` as a toast, so **messages must be user-readable**.

| Status | When |
|---|---|
| `404` | Code doesn't exist |
| `422` | It's the customer's own code |
| `409` | The customer is already linked to a referrer (at registration or by an earlier apply) |
| `403` | Not eligible under business rules, e.g. has already applied for a loan (§8.4) |

The scan entry is shown to **all** customers in phase 1; the app has no eligibility flag. Eligibility is enforced by this endpoint's `403`.

### 8.3 `POST /auth/register` — existing, no change

The backend **already accepts** an optional `referralCode`, and the app's register request model already has the field. The app will add the field to the register screen.
- `referralCode` is **optional**.
- An **invalid code must not block registration.** Create the account and skip the referral link. Losing a new customer over a typo is the worst outcome.

### 8.4 Rules the backend owns

- **One referrer per customer, ever,** whether linked at registration or through `/apply`.
- **Eligibility for `/apply`:** a business decision; the proposal is "has not applied for any loan yet".
- **Reward trigger (§7 Q9):** when the chosen event happens, move the referrer's `REFERRAL` mission to `CLAIMABLE` (§5) and add the points history row. The app displays this through the existing reward endpoints; no extra referral endpoint is needed.

---

## 9. Mobile-side change once the API is ready

For reference only; no backend action needed.

- Update the paths in `lib/core/config/api_config.dart` ("Reward / Missions" block) if they differ.
- In `lib/app.dart`, swap `RewardMockDatasource()` for `RewardRemoteDatasource(widget.dioClient)`.
- `RewardRemoteDatasource` already calls every reward endpoint above and parses the shapes shown.
- The referral endpoints (§8) and the register field are new app work, planned next.
