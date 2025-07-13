# 👤 User Profile

Each user on snacc has a customizable profile that showcases their personality, interests, and activity on the app. Profiles are central to how users discover each other, connect, and interact beyond random video calls.

---

## 📄 Profile Overview

User profiles contain the following fields:

| Field            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **Username**     | Unique @handle that identifies the user across the platform                 |
| **Display Name** | Optional display name for personalization                                   |
| **Snacc Liner**  | A short bio, thought, or quote (like a status)                              |
| **Snacc Pic**    | Profile picture (either user-uploaded or auto-generated via DiceBear)       |
| **Social Stats** | Number of followers, following, hearts received, and total snaccs posted    |
| **Snaccs**       | A list of public or followers-only text/GIF posts made by the user          |
| **Snacc Board**  | Disappearing 24-hour text-based "thoughts" visible on their profile         |
| **Tags**         | Filter tags like language, interests, age, gender, and location             |

---

## ✏️ Editable Fields

Users can update their profile at any time through the app’s profile editor:

- `username` *(must be unique)*
- `display_name`
- `snacc_liner` *(bio)*
- `snacc_pic` *(stored in Supabase Storage)*
- `language[]`
- `interests[]`
- `age_range`
- `gender`
- `location`

All of this data is stored in the `profiles` table, not the `users` table.

---

## 🔍 Profile Visibility

- Profiles are **publicly viewable** unless the user is blocked by the viewer.
- Snaccs can be:
  - **Public** → visible to anyone
  - **Followers-only** → only visible to approved followers
- Snacc Board entries are always public but **expire after 24 hours**.

---

## 🤝 Profile Actions

When viewing another user’s profile, users can:

| Action              | Availability                                |
|---------------------|---------------------------------------------|
| **Follow**          | Always available                            |
| **Unfollow**        | If already following                        |
| **Remove Follower** | If someone follows you                      |
| **Block User**      | Always available                            |
| **View Snaccs**     | Public or follower-only visibility applies  |
| **View Snacc Board**| Always visible unless blocked               |
| **Send DM**         | Available only if both users follow each other (mutual follow) |

---

## 🧠 Snacc Board

The Snacc Board is like a "story" feed on a user's profile:

- Text-based only (no media)
- Disappears automatically after 24 hours
- One active board entry per user at any time
- Viewable by anyone unless the user is blocked

---

## 🛠 Backend Notes

- All profile-related data lives in the `profiles` table.
- The `users` table is managed by **Supabase Auth** and contains core user identity info: email, UID, etc.
- Profile picture URLs are stored in `profiles.snacc_pic`, referencing files in Supabase Storage.
- Follows, reactions, snaccs, and call stats are stored in related tables and reference the user’s UID.
- All sensitive updates (like changing username or profile picture) are protected with Supabase **Row-Level Security (RLS)**.
