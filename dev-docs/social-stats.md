# 📊 Social Stats

snacc profiles include lightweight but meaningful **social stats** that reflect how active, engaging, and connected a user is. These stats are displayed publicly on user profiles and help other users gauge a person’s presence on the platform.

---

## 📈 What Are Social Stats?

| Stat               | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **Followers**      | Total number of users following this profile                                |
| **Following**      | Total number of users this profile is following                             |
| **Hearts Received**| Total number of ❤️ reactions received during video calls                    |
| **Snaccs Posted**  | Total number of snaccs (text/GIF posts) posted by the user                  |

---

## 🎯 Purpose

Social stats help users:
- Understand a person’s popularity or reach
- See who is highly active or engaged in the community
- Encourage organic discovery based on presence and content
- Offer a soft incentive for participation in calls, posting snaccs, etc.

---

## 🧮 How They're Tracked

### 1. **Followers & Following**
- Tracked via the `follows` table:
  - `follower_id` → the user doing the following
  - `followee_id` → the user being followed
- `followers_count` = count of `follows` where `followee_id = user_id`
- `following_count` = count of `follows` where `follower_id = user_id`

### 2. **Hearts Received**
- Tracked in a `hearts` table:
  - Each ❤️ sent during a video call creates a new record or increments a counter
- `hearts_received_count` = count or sum of all ❤️ received across all video calls

### 3. **Snaccs Posted**
- Tracked in the `snaccs` table:
  - Each public or follower-only snacc is a row
- `snaccs_count` = count of all active snaccs posted by the user

> Note: Snacc Board entries (ephemeral thoughts) do **not** count toward this total.

---

## 📦 Where This Data Lives

Although dynamic, we may **cache these values** in the `profiles` table for performance.  
These fields are updated via triggers or on-demand logic:

- `profiles.followers_count`
- `profiles.following_count`
- `profiles.hearts_count`
- `profiles.snaccs_count`

This allows quick read access without needing to calculate on every profile load.

---

## 👁️ Display Logic

Social stats are shown prominently on every user profile, with icons and counts:

- **Followers / Following** → tap to view user lists  
- **Hearts** → read-only, shown as a simple number  
- **Snaccs** → tap to open their snacc feed

---

## 🧠 Edge Cases

- **Blocked users** will not contribute to visible stats for each other.
- **Deleted accounts** will automatically be excluded from counts.
- **Inactive users** (not in calls or posting) still retain past stats unless removed.
