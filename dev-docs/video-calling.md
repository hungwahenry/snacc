# 🎥 Video Calling

Video calls are the heart of user discovery in snacc. Unlike traditional video chats, snacc uses a fast-paced, swipe-driven, TikTok-style format to connect users with strangers for real-time face-to-face interactions.

It’s quick, spontaneous, and driven by vibes — not algorithms.

---

## ⚙️ How It Works

- Users enter the **"Call Zone"**, a dedicated screen where they get matched with other active users
- When matched:
  - A **live video call** begins instantly
  - Users can **see, hear, and interact** in real time
- Users can **stay**, **swipe to the next match**, or **tap on the other user’s profile**

Calls are **1-to-1** and time-limited (configurable, e.g. 60 seconds max before auto-swipe unless extended)

---

## 🔍 User Matching

Matching logic is driven by:

1. **Presence** – Only users who are currently active and in the Call Zone are matchable  
2. **Filters** (optional, set in profile):
   - **Language**
   - **Gender**
   - **Location**
   - **Age**
   - **Interest tags**
3. **Exclusions**:
   - Blocked users
   - Previously skipped users (optional memory window)

Matching is randomized within the filtered pool.

---

## ❤️ In-Call Interactions

During a call, users can:

| Action                 | Description                                                                |
|------------------------|----------------------------------------------------------------------------|
| **Heart**              | Send a ❤️ to the other user — this increases their **hearts received** stat |
| **View Profile**       | Tap to open the user’s profile (without ending the call)                   |
| **Follow**             | Follow the user directly from the call screen                              |
| **Block/Report**       | Access moderation options during the call                                  |
| **Next**               | Skip to the next call at any time                                          |

> Hearts are **single-tap** and can only be sent once per call. They are permanent and add to the user’s public stats.

---

## 🧠 Session Management

- Each call session is logged:
  - Participants (user A + B)
  - Start and end timestamps
  - Whether either user hearted, followed, blocked, or reported
- Stored in a `call_sessions` table

| Field         | Description                              |
|----------------|------------------------------------------|
| `id`           | Unique call session ID                   |
| `user_a_id`    | Caller A                                 |
| `user_b_id`    | Caller B                                 |
| `started_at`   | Timestamp when call began                |
| `ended_at`     | Timestamp when call ended                |
| `user_a_hearted` | Boolean                                |
| `user_b_hearted` | Boolean                                |
| `user_a_followed` | Boolean                               |
| `user_b_followed` | Boolean                               |

---

## 📲 UI Behavior

- **Full screen vertical layout** with floating buttons
- Countdown timer or manual skip available
- Incoming calls are auto-matched — no ringing or delay
- Smooth transition animation when skipping or ending a call

Call controls include:
- Heart 💖
- View Profile 👤
- Follow ➕
- Skip ⏭️
- Block/Report 🚫

---

## 🛡️ Privacy & Safety

- Calls are **not recorded**
- No contact details are shared
- Mutual follows are required to unlock DMs
- Blocked users cannot be rematched
- Abuse prevention via reporting, rate limits, and session logs