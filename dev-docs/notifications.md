# 🔔 Notifications

snacc uses notifications to keep users engaged, informed, and connected. Notifications are triggered by key social events and delivered through **Expo Notifications**, both inside the app and as push alerts to users' devices.

---

## 📦 Notification Categories

Notifications are grouped into four categories:

| Category      | Description                                              |
|----------------|----------------------------------------------------------|
| `social`       | Interactions with your snaccs, profile, or content       |
| `follow`       | Follows and mutual connections                           |
| `message`      | Direct messages and chat updates                         |
| `system`       | Feature tips, onboarding nudges, or app announcements    |

---

## 🔔 Events That Trigger Notifications

### 👥 Follow & Connection Events

| Event                            | Message Example                                  | Category |
|----------------------------------|--------------------------------------------------|----------|
| Someone follows you              | `@luna started following you`                    | follow   |
| You and another user follow each other | `You and @alex are now connected!`         | follow   |

---

### ❤️ Snacc Reactions

| Event                            | Message Example                                  | Category |
|----------------------------------|--------------------------------------------------|----------|
| Someone reacted to your snacc    | `@milo reacted to your snacc`                    | social   |
| Your snacc reached engagement milestone | `Your snacc is gaining attention! 🔥`       | social   |

---

### 🎥 Video Call Events

| Event                            | Message Example                                  | Category |
|----------------------------------|--------------------------------------------------|----------|
| Someone hearted you during call  | `@ivy sent you a heart during a call`            | social   |
| You were followed after a call   | `@dave followed you after your call`             | follow   |
| You matched with someone         | `You and @ariel are now connected`               | follow   |

---

### 💬 Messaging

| Event                            | Message Example                                  | Category |
|----------------------------------|--------------------------------------------------|----------|
| New message in a DM              | `@lex sent you a new message`                    | message  |

> DMs are only available to mutual follows.

---

### 🚨 System Alerts

| Event                            | Message Example                                  | Category |
|----------------------------------|--------------------------------------------------|----------|
| Onboarding reminders             | `Don't forget to complete your profile ✨`        | system   |
| Feature announcements            | `New: Add GIFs to your snaccs!`                  | system   |
| Policy changes                   | `Our Terms of Service have been updated`         | system   |

---

## 📱 Delivery: Expo Notifications

All notifications are sent using **[Expo Notifications](https://docs.expo.dev/push-notifications/overview/)**.

| Delivery Type        | Description                                                                |
|-----------------------|----------------------------------------------------------------------------|
| **Push notifications** | Sent via Expo’s push API to the user’s device (FCM for Android, APNs for iOS) |
| **In-app notifications** | Displayed in the snacc app’s notification center                       |

### 🔧 Device Registration

- Each user must allow notifications and register their device’s Expo Push Token
- Token is stored securely in the `profiles` table
- The app sends push notifications via Supabase edge function → Expo Push API

---

## 🧾 Backend Structure

Notifications are stored in the `notifications` table.

| Field           | Type      | Description                               |
|------------------|-----------|-------------------------------------------|
| `id`             | UUID      | Primary key                               |
| `user_id`        | UUID      | Recipient                                 |
| `type`           | String    | Event type (e.g. `reaction`, `follow`)    |
| `category`       | Enum      | One of: `social`, `follow`, `message`, `system` |
| `data`           | JSONB     | Context payload (e.g. snaccId, senderId)  |
| `read`           | Boolean   | Whether the notification has been opened  |
| `created_at`     | Timestamp | When the event occurred                   |

---

## 🧠 In-App Notification Center

- Notifications are shown in reverse chronological order
- Highlighted if unread
- Tap to open the related snacc, profile, or message
- Swipe or tap to mark as read

---

## 🔐 Privacy & RLS

- Notifications are private and visible only to `user_id`
- RLS ensures only the owner can read/write their notifications
- Push tokens are stored in user profiles with restricted access

---

## 🔄 User Settings

Users can configure:
- Push notification preferences (per category)
- Mute individual users (future feature)
- In-app vs push toggle (coming soon)
