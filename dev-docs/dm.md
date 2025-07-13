# 💬 Direct Messaging (DM)

Direct Messaging in snacc allows users to privately chat in real time with people they’ve mutually followed. It includes everything you'd expect from a modern chat experience — typing indicators, sent/delivered/read statuses, and instant message delivery.

---

## 🔐 Who Can DM?

| Condition                                       | DM Allowed? |
|--------------------------------------------------|-------------|
| You follow them + they follow you (mutual)       | ✅ Yes       |
| One-way follow (you follow them or vice versa)   | ❌ No        |
| You blocked them or were blocked                 | ❌ No        |

DMs are only available to mutually connected users. Removing the follow or blocking ends the DM relationship immediately.

---

## ✨ Features

DMs include:

- ✅ Real-time 1-to-1 chat
- ✅ Typing indicators
- ✅ Message status: `sent`, `delivered`, `read`
- ✅ Full message history
- ✅ Sorted by most recent activity
- ✅ In-app and push notifications
- ✅ Local delete per user
- ✅ Unread count indicators

---

## 💬 Message Status Definitions

| Status      | Meaning                                                             |
|-------------|----------------------------------------------------------------------|
| `sent`      | Message has been sent to the backend and stored                     |
| `delivered` | The receiver's device has received the message (via socket/sub)     |
| `read`      | The receiver has viewed the message in the conversation thread      |

Messages transition from `sent → delivered → read` in real time.

---

## ✍️ Typing Indicator

- Typing state is sent as a **transient event** via real-time socket or Supabase Realtime
- Shows a small `"@alex is typing..."` indicator in the chat header
- Automatically removed after 3 seconds of inactivity or on message send

---

## 🧾 Data Structure

### `messages` table

| Field           | Type      | Description                                 |
|------------------|-----------|---------------------------------------------|
| `id`             | UUID      | Message ID                                  |
| `sender_id`      | UUID      | User sending the message                    |
| `receiver_id`    | UUID      | User receiving the message                  |
| `text`           | String    | Message content                             |
| `status`         | Enum      | `sent`, `delivered`, `read`                 |
| `created_at`     | Timestamp | Time message was sent                       |
| `read_at`        | Timestamp | Nullable — time message was read            |
| `delivered_at`   | Timestamp | Nullable — time message was delivered       |
| `deleted_by`     | UUID[]    | Users who locally deleted this message      |

> `status` is updated in real-time as delivery and read receipts are confirmed.

---

### `dm_threads` table

| Field            | Description                               |
|------------------|-------------------------------------------|
| `id`             | UUID                                      |
| `user_a_id`      | First user                                |
| `user_b_id`      | Second user                               |
| `last_message_at`| Timestamp of most recent message          |
| `unread_count_a` | Count of unread messages for user A       |
| `unread_count_b` | Count of unread messages for user B       |
| `typing_a`       | Boolean — is user A typing                |
| `typing_b`       | Boolean — is user B typing                |

This table allows for fast inbox rendering, unread badges, and typing status tracking.

---

## 🔁 Lifecycle Events

### Sending a Message

1. User sends a message → saved as `sent`
2. Receiver's client receives it via socket → `delivered_at` set
3. When receiver opens the chat → `read_at` and `status = read`

### Reading Messages

- On opening a thread, all `delivered` messages become `read`
- Triggers unread count reset

### Deleting Messages (Local Only)

- User may delete a message from their view
- Entry is added to `deleted_by` array
- Message is hidden locally, remains in the database

---

## 🧠 Realtime Logic

- All DM activity is handled over Supabase Realtime or custom socket layer:
  - Message delivery
  - Typing state
  - Message read status updates
- Conversations are auto-synced in inbox view

---

## 🔐 Blocking & Follow Enforcement

- If either user blocks the other:
  - Thread is immediately archived or hidden
  - No further messages can be exchanged
- If a mutual follow is broken:
  - DM thread is locked until mutual follow is re-established

---

## 🔔 Notifications

- New messages trigger:
  - **In-app notification badge**
  - **Push notification via Expo**
- Push includes sender’s display name and message preview

> Notifications are disabled if the user is inside the thread (to prevent duplicates)

---

## 🧾 RLS & Privacy

- Only sender and receiver can read/write their messages
- Supabase RLS policies enforce strict access controls on both `messages` and `dm_threads` tables
- No admin/mod visibility into DMs unless flagged for review