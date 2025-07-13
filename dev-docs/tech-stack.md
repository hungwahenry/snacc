# 🛠️ Tech Stack

snacc is being built with a modern, serverless, and highly modular architecture. The goal is to ship fast, scale cleanly, and maintain a clear separation of concerns — without ever needing a traditional backend server.

---

## 🧱 Core Technologies

### ⚛️ React Native (with Expo)
- Cross-platform mobile development for iOS and Android.
- Built with **Expo** to accelerate development with minimal native configuration.
- Uses **React App Router** to enable a file-based routing system, similar to Next.js.
- Clean navigation and screen structure out-of-the-box.

### 🗂️ File-Based Routing with React App Router
- Pages, layouts, and routes follow a **Next.js-style folder structure**.
- All routes, screens, and nested views are managed declaratively.
- Dynamic segments and route grouping provide flexibility.

---

## 🔥 Supabase

### 🔐 Supabase Auth
- Magic Link / OTP login via email.
- Auth flow supports both sign up and login using the same flow.
- Onboarding detects new vs. existing users and handles them accordingly.

### 🧮 Supabase Database (Postgres)
- All app data — users, follows, snaccs, reactions, calls — is stored here.
- Uses **Row-Level Security (RLS)** to enforce access control rules.
- Queries are direct from the app using Supabase client SDKs or isolated backend logic files.

### 🗃️ Supabase Storage
- Stores user-uploaded content like profile pictures (snacc pics) and optional GIFs.
- Integrated into onboarding and profile editing flows.

---

## 🧩 Architecture Philosophy

### 🧭 One Codebase, Two Realms
All logic and UI live in a **single monorepo**, but are separated by role:

- `/app` → all frontend pages, screens, and components  
- `/lib/backend/` → backend logic for interacting with Supabase (queries, mutations, RPC)  
- `/lib/shared/` → shared utilities, types, constants  
- `/constants/` → central token definitions and configuration

### 🔗 Clean Separation of Concerns
- No backend logic (queries, mutations, state) should exist directly in UI components.
- Instead, frontend components **call clean bridge functions** that handle data operations.
- This keeps frontend declarative and backend centralized, testable, and modular.

### 🧼 No Node Server Required
- Absolutely no custom Express or server frameworks.
- All backend logic is handled through:
  - Supabase edge functions (where needed)
  - Pure client → Supabase SDK calls
  - Optional RPCs or views for complex data queries
