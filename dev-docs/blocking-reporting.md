# 🚫 Blocking & Reporting

snacc prioritizes user safety and boundaries. To maintain a healthy social environment, users have the ability to **block** or **report** other users directly from profiles or during video calls.

These tools are meant to be fast, discreet, and final — once you block someone, all visibility and interaction between you is cut off. Reporting sends abuse or violation signals to our internal moderation system.

---

## 🙅 Blocking a User

Blocking is a **two-way restriction** — once a user is blocked, neither party can see or interact with the other.

### 🔒 Effects of Blocking

| Action                        | Result                                                                      |
|-------------------------------|-----------------------------------------------------------------------------|
| Profile View                  | Blocked user cannot view your profile, stats, snaccs, or board              |
| Snacc Reactions               | All reactions from blocked users are removed and future reactions blocked  |
| Video Call Matching           | Blocked users are excluded from video matchmaking                          |
| DM/Mutual Follow              | Any existing follow relationships are removed, DMs are disabled             |
| Discovery & Mentions          | Blocked users won’t appear in discovery or be able to tag you               |

> Blocking is **silent** — the other user will not be notified.

### 🧠 One-Way Data Cleanup

When a block occurs:
- Reactions by the blocked user on your snaccs are removed
- Your reactions on their snaccs are removed
- Any mutual following entries are deleted
- Existing DMs are hidden or marked inactive

---

## ✅ How to Block

You can block another user from:
- Their **profile** (Block button in options menu)
- A **video call** (Block from call controls)
- A **DM thread** (via conversation options)

Blocked users are stored in a `blocked_users` table.

| Field         | Description                        |
|----------------|------------------------------------|
| `blocker_id`   | The user initiating the block      |
| `blocked_id`   | The user being blocked             |
| `created_at`   | When the block was applied         |

---

## 🚨 Reporting a User

Reporting is used when a user violates community guidelines or terms of service.  
It’s **not the same as blocking** — blocking protects you; reporting flags the account for moderation.

### 🎯 What Can Be Reported

- Video call behavior (nudity, abuse, hate, etc.)
- Snaccs (offensive or spammy content)
- Profile (inappropriate info, impersonation, etc.)
- Messages (harassment, scams, etc.)

### 📝 Report Metadata

Each report includes:
- Reporter user ID
- Reported user ID
- Context (e.g. `video_call`, `snacc`, `profile`, `message`)
- Optional notes or screenshot (future feature)
- Created at timestamp

Stored in the `reports` table.

| Field         | Description                           |
|----------------|---------------------------------------|
| `id`           | Unique report ID                      |
| `reporter_id`  | The user making the report            |
| `target_id`    | The user being reported               |
| `context`      | Area the report relates to            |
| `reason`       | Selected reason or short text         |
| `created_at`   | Timestamp of submission               |

---

## 🔐 Privacy & Moderation

- Block lists and report submissions are **private**
- Users do not get notified when reported
- Reports are reviewed manually or through moderation tooling
- We may auto-ban or flag accounts with multiple reports depending on severity

---

## ✋ Edge Cases & Enforcement

| Case                                | Result                                                                 |
|-------------------------------------|------------------------------------------------------------------------|
| Both users block each other         | Connection and visibility is fully severed both ways                   |
| User blocks, then unblocks          | No data is restored — DMs, follows, and reactions remain deleted      |
| Attempt to message a blocked user   | Fails silently (DM unavailable)                                        |
| Reporting without blocking          | Allowed — user can report without choosing to block                   |
