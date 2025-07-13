# 😄 Snacc Reactions

Reactions on snaccs let users respond quickly and playfully using emojis. Rather than just liking a post, users choose a single emoji that best expresses how they feel — simple, expressive, and fun.

---

## 💡 What Are Snacc Reactions?

- Emoji-based reactions to **snaccs** (not Snacc Board entries)
- Users can react with **only one emoji per snacc**
- Selecting a new emoji **replaces the previous one**
- All reactions are **public** and visible under the snacc

---

## 🧠 Reaction Rules

| Rule                             | Behavior                                                                 |
|----------------------------------|--------------------------------------------------------------------------|
| **One emoji per snacc per user** | Users can only have one active reaction on each snacc                    |
| **Changing emoji**              | Selecting a new emoji replaces the previous one                          |
| **Tapping same emoji again**     | Removes the reaction (acts as a toggle)                                  |
| **Reactions are public**         | Anyone viewing the snacc can see total reaction counts                   |
| **No reactions on board entries**| Reactions are only allowed on regular snaccs (not Snacc Board posts)     |

---

## 🔍 Visibility

Reactions are displayed under each snacc as:
- Emoji + total count
- Tapping the emoji (or hover/long press) shows which users reacted

Example:
```text
😂 12   👀 4   😮 1
````

---

## ➕ Reacting to a Snacc

When a user reacts:

1. If no reaction exists → their emoji is saved
2. If they already reacted with a different emoji → the new emoji **replaces** the old one
3. If they tap the **same emoji** again → their reaction is **removed**

---

## ❌ Removing a Reaction

* Tap your current emoji again to remove it.
* This deletes your reaction for that snacc.

---

## 🧾 Backend Structure

Reactions are stored in a `reactions` table:

| Field        | Type      | Description                              |
| ------------ | --------- | ---------------------------------------- |
| `id`         | UUID      | Primary key                              |
| `snacc_id`   | UUID      | The snacc this reaction belongs to       |
| `user_id`    | UUID      | The user who reacted                     |
| `emoji`      | String    | The emoji character (e.g. "😂", "🔥")    |
| `created_at` | Timestamp | When the reaction was created or updated |

> Unique constraint: (`snacc_id`, `user_id`)
> This ensures each user can only have **one reaction per snacc**

---

## 🔄 Reaction Behavior Summary

| Action                 | Result                 |
| ---------------------- | ---------------------- |
| Tap emoji (first time) | Add reaction           |
| Tap a different emoji  | Replace existing emoji |
| Tap same emoji again   | Remove the reaction    |

---

## 🔐 Access & RLS

* Users can:

  * React to any snacc they have permission to view (public or follower-only)
  * View all public reaction counts
  * Delete only their own reactions
* Enforced using Supabase **Row-Level Security (RLS)**
