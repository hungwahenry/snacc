# 📌 Snacc Board

The **Snacc Board** is a lightweight feature where users can post temporary, text-based thoughts that disappear after 24 hours. Think of it as a cross between a story and a tweet — raw, fleeting, and personal.

Every user has a Snacc Board section on their profile, visible to anyone who visits (unless blocked).

---

## 💡 What is a Snacc Board Entry?

- A **single, short text-only post**
- **Ephemeral** — automatically disappears after 24 hours
- Meant for moods, quotes, jokes, random thoughts
- Appears at the top of the user’s profile
- **Public** by default — no follower-only option
- Cannot be reacted to or commented on

---

## 📝 Creating a Snacc Board Entry

Users can:
1. Open the “Snacc Board” tab or editor
2. Type a short text (up to a set limit, e.g. 150 characters)
3. Tap **Post**

Rules:
- **One active entry at a time**
- Posting a new entry replaces the existing one
- Cannot include GIFs or media — **text-only**

---

## 🕒 Expiry & Lifecycle

- All board entries **expire exactly 24 hours** after posting
- After expiry, the entry is automatically deleted
- The user can also **manually delete** their entry before it expires

---

## 🔍 Display

On user profiles:
- Board entries are shown **above** regular snaccs
- Text is styled to stand out visually (like a sticky note)
- Shows **posted time** and a **countdown** if viewing your own profile
- Viewers never see expired entries

---

## 🔐 Privacy

- Snacc Boards are **public** — no visibility filtering
- However, blocked users cannot see each other's boards
- Content is not indexed or shareable outside the app

---

## 🧾 Backend Structure

Board entries are stored in a `snacc_board` table.

| Field         | Type      | Description                         |
|----------------|-----------|-------------------------------------|
| `id`           | UUID      | Primary key                         |
| `user_id`      | UUID      | Linked user                         |
| `text`         | String    | Content (required, no media)        |
| `created_at`   | Timestamp | Timestamp of posting                |
| `expires_at`   | Timestamp | Auto-calculated: `created_at + 24h` |

Cleanup:
- Snacc Board entries are automatically expired via a scheduled job or query that deletes rows where `expires_at < now()`

---

## ⚠️ Limitations

- No reactions
- No visibility toggle
- Only one active post per user
- Text-only (no GIFs or formatting)
