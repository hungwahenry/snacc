# 📝 Snaccs

A **snacc** is a short-form, expressive post made up of text, a GIF, or both. Users post snaccs to share thoughts, vibes, or reactions directly on their profile. They're social, snack-sized, and meant to reflect the user's personality or mood.

---

## 💡 What is a Snacc?

A snacc is:
- A **short message**, a **GIF**, or a combination of both
- Posted to a user’s public profile
- **Reactable** with emoji reactions
- **Permanent** until deleted by the user (not ephemeral like Snacc Board posts)

---

## ✍️ Snacc Content Structure

| Field           | Description                                                         |
|------------------|---------------------------------------------------------------------|
| `id`             | Unique identifier (UUID)                                            |
| `user_id`        | Owner of the snacc                                                  |
| `text`           | Optional short message (emoji, phrase, status, etc.)               |
| `gif_url`        | Optional GIF URL (fetched from **GIPHY API**)                       |
| `visibility`     | `"public"` or `"followers"`                                         |
| `created_at`     | Timestamp of creation                                               |

> At least one of `text` or `gif_url` must be present to create a valid snacc.

---

## ➕ Snacc Types

Users can create the following types of snaccs:

| Type            | Allowed? | Example                                                   |
|------------------|----------|-----------------------------------------------------------|
| Text only        | ✅        | `"feeling cute, might delete later"`                    |
| GIF only         | ✅        | A reaction GIF from GIPHY with no caption                |
| GIF + Text       | ✅        | A meme GIF with a short thought or caption               |
| Empty            | ❌        | Neither text nor gif (not allowed)                       |

---

## 🌐 GIPHY Integration

- Users search for and select GIFs using the **GIPHY API** within the snacc creation screen
- The selected GIF’s URL is stored in the `gif_url` field
- We may cache metadata (e.g. `gif_id`, `source`) for analytics or deduplication
- GIFs are embedded using the original GIPHY-hosted URL — no need for Supabase Storage

---

## 🔐 Visibility Options

| Visibility      | Who Can See                                                     |
|------------------|------------------------------------------------------------------|
| `public`         | Anyone can see the snacc on the user's profile                  |
| `followers`      | Only visible to users who follow the poster                     |

Users choose visibility at the time of posting. It can be changed only by deleting and reposting.

---

## 😄 Emoji Reactions

Each snacc supports **emoji reactions**, but users can react with **only one emoji per snacc**.  
Selecting a new emoji replaces the old one. Reactions are public and displayed beneath the snacc.

See [`snacc-reactions.md`](./snacc-reactions.md) for full details.

---

## 🧾 Backend Structure

Snaccs are stored in the `snaccs` table.

| Field         | Type      | Description                              |
|----------------|-----------|------------------------------------------|
| `id`           | UUID      | Primary key                              |
| `user_id`      | UUID      | Foreign key to `profiles` table          |
| `text`         | String    | Optional text message                    |
| `gif_url`      | String    | Optional GIPHY embed URL                 |
| `visibility`   | Enum      | `"public"` or `"followers"`              |
| `created_at`   | Timestamp | Auto-generated on insert                 |

---

## 🔍 Display & Sorting

- Snaccs are shown in reverse chronological order (`created_at DESC`)
- Viewers only see:
  - Public snaccs
  - Follower-only snaccs (if they follow the user)
- Each snacc shows its:
  - Text
  - GIF (if present)
  - Reactions summary
  - Posted time

---

## 🧹 Deleting Snaccs

- Users can delete their own snaccs at any time
- Deletion also removes all related reactions for that snacc
- Once deleted, the snacc is immediately removed from the profile feed

---

## ✅ Summary

Snaccs are:
- Fast, expressive text or GIF-based profile posts
- Powered by GIPHY for effortless visual expression
- Designed to be public or private (follower-only)
- Simple to react to and easy to share

Whether it’s a meme, a mood, or a message — drop a snacc.
