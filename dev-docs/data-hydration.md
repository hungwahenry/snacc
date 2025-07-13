### `docs/data-hydration.md`

````markdown
# 💧 Data Hydration Strategy

The snacc app uses a **modular data hydration strategy** to ensure each screen or workflow loads its data in a single, optimized batch. This minimizes round-trips, prevents redundant queries, and keeps the frontend and backend logic clearly separated.

All hydration payloads are delivered through Supabase views, RPCs, or edge functions.

---

## 🧑‍💼 1. Current User Context (`/me`)

Hydrates core user data for the dashboard, profile, onboarding, filters, and more.

### RPC: `get_current_user_context()`

### Returns:
```ts
{
  profile: {
    id,
    username,
    display_name,
    snacc_pic_url,
    snacc_liner,
    language,
    gender,
    age,
    location,
    interest_tags,
    hearts_received,
    snaccs_count,
    followers_count,
    following_count,
    created_at,
    updated_at
  },
  snacc_board: {
    id,
    content,
    created_at,
    expires_at
  } | null,
  push_token: string | null,
  unread_notifications_count: number,
  unread_dm_count: number,
  blocked_users: string[]
}
````

---

## 👤 2. Viewing Another User’s Profile

Hydrates everything needed to render another user’s public profile view.

### RPC: `get_user_profile(user_id)`

### Returns:

```ts
{
  profile: { ... },
  recent_snaccs: [
    {
      id,
      text,
      gif_url,
      created_at,
      visibility,
      user_reaction: { emoji } | null
    }
  ],
  snacc_board: { ... } | null,
  is_following: boolean,
  is_followed_by: boolean,
  mutual_follow: boolean,
  blocked: boolean
}
```

---

## 💬 3. Inbox Overview (`/messages`)

Hydrates the full DM inbox in a single call.

### RPC: `get_dm_inbox()`

### Returns:

```ts
[
  {
    thread_id,
    user: {
      id,
      username,
      display_name,
      snacc_pic_url
    },
    last_message: {
      text,
      created_at,
      sender_id,
      status
    },
    unread_count: number,
    is_typing: boolean
  }
]
```

---

## 💬 4. Chat View (`/messages/:thread_id`)

Hydrates a full thread for messaging screen.

### RPC: `get_dm_thread(thread_id)`

### Returns:

```ts
{
  thread: {
    thread_id,
    user: { id, username, display_name, snacc_pic_url },
    typing: boolean,
    unread_count: number
  },
  messages: [
    {
      id,
      sender_id,
      receiver_id,
      text,
      status, // "sent" | "delivered" | "read"
      created_at
    }
  ],
  last_read_message_id: string | null
}
```

---

## 🎥 5. Live Video Call Match

When matched with another user, this call hydrates their live card.

### RPC: `get_video_call_profile(user_id)`

### Returns:

```ts
{
  profile: {
    id,
    username,
    display_name,
    snacc_pic_url,
    snacc_liner,
    hearts_received,
    followers_count,
    following_count
  },
  mutual_follow: boolean,
  is_following: boolean,
  is_followed_by: boolean,
  recent_snaccs: [
    {
      id,
      text,
      gif_url,
      created_at
    }
  ]
}
```

---

## 🔔 6. Notification Center

Returns the user's recent notifications.

### RPC: `get_notifications(limit: number)`

### Returns:

```ts
[
  {
    id,
    type,
    category,
    data, // JSON payload (e.g. snacc_id, user info)
    read,
    created_at
  }
]
```

---

## 🧠 7. Global Config Bootload

This is fetched once on app launch and cached.

### RPC: `get_app_config()`

### Returns:

```ts
{
  templates: {
    themes: [...],
    transitions: [...],
    haptics: [...]
  },
  snacc_limits: {
    max_length: 280,
    board_expiry_hours: 24
  },
  giphy_api_key: string,
  feature_flags: {
    enable_dms: true,
    enable_report: true,
    call_matching: "on"
  }
}
```

---

## 🛡️ Hydration Rules

| Principle                  | Explanation                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| ✅ One Call Per Screen      | Every major screen/component should be hydratable from a single RPC     |
| ❌ No Fragmented Fetches    | Never request partial user data from multiple places                    |
| ✅ Server-Batched           | Use Supabase Edge Functions or RPCs for joins, status checks            |
| ✅ Cache Smartly            | Cache global config and `/me` context during session                    |
| ✅ Pagination for Lists     | Messages, notifications, snaccs should be paginated                     |
| ✅ Include Permission Flags | Include booleans like `is_following`, `mutual_follow`, etc. in payloads |
