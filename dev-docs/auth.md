# 🔐 Authentication

snacc uses **Supabase Auth** with **Magic Code (OTP)** for secure, passwordless authentication. Users sign in or sign up using their email address, and based on their account status, the app determines the next step — login or onboarding.

---

## ✉️ Sign Up & Login Flow

### Step-by-Step:

1. **User enters their email**  
   → We send a **6-digit one-time password (OTP)** to their email via Supabase.

2. **User inputs OTP**  
   → The app verifies the code using Supabase Auth.

3. **Backend determines user state**:
   - **If user exists** → treat as a login  
   - **If user is new** → create new profile and proceed to onboarding

4. **Successful login or signup**:
   - Supabase returns a session (access + refresh token)
   - Session is stored securely on device and kept alive

---

## 👶 Onboarding for New Users

After a successful signup, the user enters the **onboarding flow**, which includes:

- Setting a **username** (required)
- Setting a **display name** (optional)
- Uploading or accepting a default profile picture (DiceBear avatar)
- Saving default profile metadata (bio, filters, etc.)

Once onboarding is complete, the user is redirected to the app’s main flow.

---

## 💾 Session Management

### Storing Sessions
- Supabase automatically handles access and refresh tokens.
- We persist the session using **SecureStore (Expo).
- On app launch, we check for an existing valid session and restore the user state.

### Refreshing Sessions
- Supabase client handles automatic session refreshes in the background.
- No need for manual token refresh logic.

---

## 🔄 Session Persistence Strategy

1. On app start:
   - Load session from storage (if exists)
   - If valid → restore user context
   - If expired or invalid → redirect to login

2. On login/signup:
   - Store Supabase session in secure local storage

3. On logout:
   - Clear storage and reset app state

---

## 🛡️ Notes

- All authentication is **passwordless**.
- No separate login and signup screens — it's a **single flow**.
- Sessions are handled **client-side**, but enforced server-side with RLS policies in Supabase.
