# 🔁 Follows & Following

The follow system in **snacc** is simple but central to the social layer of the app. It determines who can see certain content, who can DM whom, and how users grow their connections.

---

## 👥 How Following Works

### One-Way Follow
- Any user can follow another user.
- Following is **not mutual by default**.
- Followers are visible in a user’s profile social stats.

### Mutual Follow
- When **two users follow each other**, they unlock:
  - **Direct Messaging (DMs)**
  - **Access to each other's follower-only snaccs**

---

## ✅ Follow Actions

| Action            | Description                                               |
|-------------------|-----------------------------------------------------------|
| **Follow**        | Start following another user                              |
| **Unfollow**      | Stop following a user (does not remove them as a follower)|
| **Remove Follower**| Remove someone who follows you                           |
| **Block**         | Completely prevent any interaction or visibility          |

All actions are immediate and reflected in profile stats.

---

## 🔐 Visibility Rules

| Content Type         | Public Viewer | Follower | Mutual Follower |
|----------------------|---------------|----------|------------------|
| Profile Info         | ✅            | ✅       | ✅               |
| Public Snaccs        | ✅            | ✅       | ✅               |
| Follower-Only Snaccs | ❌            | ✅       | ✅               |
| Snacc Board          | ✅            | ✅       | ✅               |
| Direct Messages      | ❌            | ❌       | ✅               |

---

## ⚠️ Blocking a User

Blocking fully severs connection:

- Blocks calls, profile views, follows, snacc visibility, DMs
- Removes both users from each other’s followers/following lists
- Automatically removes any existing DM channel between them

> Blocking is silent — the blocked user is not notified.

---

## 🧠 Backend Structure

All follows are stored in the `follows` table.

| Field           | Type      | Description                           |
|------------------|-----------|---------------------------------------|
| `id`             | UUID      | Primary key                           |
| `follower_id`    | UUID      | The user who follows                  |
| `followee_id`    | UUID      | The user being followed               |
| `created_at`     | Timestamp | When the follow action happened       |

---

## 🔄 Follow State Detection

The app detects the relationship state between two users to determine what UI and features should be available:

- **No relationship** → Show "Follow"
- **Following only** → Show "Unfollow"
- **Followed by only** → Show "Remove Follower"
- **Mutual** → Show "Message" + "Unfollow"
- **Blocked** → Show "Blocked" / hide profile

---

## 📱 UI Examples

- **Visit someone's profile**:
  - Tap “Follow” to follow
  - If already following: “Unfollow”
  - If you're being followed: “Remove Follower”
  - If mutual: “Message” appears

- **View your own followers**:
  - Tap "Remove Follower" next to users you want to drop

---

## 🛡️ RLS & Privacy

- Follows are protected by **Row-Level Security (RLS)**.
- Users can only see follow relationships involving themselves.
- Public profile data is still available unless blocked.
