Signing out

Signing out a user

Signing out a user works the same way no matter what method they used to sign in.

Call the sign out method from the client library. It removes the active session and clears Auth data from the storage medium.


JavaScript

Dart

Swift

Kotlin

Python
async function signOut() {
  const { error } = await supabase.auth.signOut()
}
Sign out and scopes#
Supabase Auth allows you to specify three different scopes for when a user invokes the sign out API in your application:

global (default) when all sessions active for the user are terminated.
local which only terminates the current session for the user but keep sessions on other devices or browsers active.
others to terminate all but the current session for the user.
You can invoke these by providing the scope option:


JavaScript

Dart

Kotlin
// defaults to the global scope
await supabase.auth.signOut()
// sign out from the current session only
await supabase.auth.signOut({ scope: 'local' })
Upon sign out, all refresh tokens and potentially other database objects related to the affected sessions are destroyed and the client library removes the session stored in the local storage medium.