Native Mobile Deep Linking

Set up Deep Linking for mobile applications.

Many Auth methods involve a redirect to your app. For example:

Signup confirmation emails, Magic Link signins, and password reset emails contain a link that redirects to your app.
In OAuth signins, an automatic redirect occurs to your app.
With Deep Linking, you can configure this redirect to open a specific page. This is necessary if, for example, you need to display a form for password reset, or to manually exchange a token hash.

Setting up deep linking#

Expo React Native

Flutter

Swift

Android Kotlin
To link to your development build or standalone app, you need to specify a custom URL scheme for your app. You can register a scheme in your app config (app.json, app.config.js) by adding a string under the scheme key:

{
  "expo": {
    "scheme": "com.supabase"
  }
}
In your project's auth settings add the redirect URL, e.g. com.supabase://**.

Finally, implement the OAuth and linking handlers. See the supabase-js reference for instructions on initializing the supabase-js client in React Native.

import { Button } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "app/utils/supabase";
WebBrowser.maybeCompleteAuthSession(); // required for web only
const redirectTo = makeRedirectUri();
const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return;
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};
const performOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  const res = await WebBrowser.openAuthSessionAsync(
    data?.url ?? "",
    redirectTo
  );
  if (res.type === "success") {
    const { url } = res;
    await createSessionFromUrl(url);
  }
};
const sendMagicLink = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: "valid.email@supabase.io",
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
  // Email sent.
};
export default function Auth() {
  // Handle linking into app from email app.
  const url = Linking.useURL();
  if (url) createSessionFromUrl(url);
  return (
    <>
      <Button onPress={performOAuth} title="Sign in with Github" />
      <Button onPress={sendMagicLink} title="Send Magic Link" />
    </>
  );
}
For the best user experience it is recommended to use universal links which require a more elaborate setup. You can find the detailed setup instructions in the Expo docs.

