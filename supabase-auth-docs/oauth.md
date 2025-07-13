Social Login

Social Login (OAuth) is an open standard for authentication that allows users to log in to one website or application using their credentials from another website or application. OAuth allows users to grant third-party applications access to their online accounts without sharing their passwords.
OAuth is commonly used for things like logging in to a social media account from a third-party app. It is a secure and convenient way to authenticate users and share information between applications.

Benefits#
There are several reasons why you might want to add social login to your applications:

Improved user experience: Users can register and log in to your application using their existing social media accounts, which can be faster and more convenient than creating a new account from scratch. This makes it easier for users to access your application, improving their overall experience.

Better user engagement: You can access additional data and insights about your users, such as their interests, demographics, and social connections. This can help you tailor your content and marketing efforts to better engage with your users and provide a more personalized experience.

Increased security: Social login can improve the security of your application by leveraging the security measures and authentication protocols of the social media platforms that your users are logging in with. This can help protect against unauthorized access and account takeovers.

Set up a social provider with Supabase Auth#
Supabase supports a suite of social providers. Follow these guides to configure a social provider for your platform.

Login with Google

Supabase Auth supports Sign in with Google for the web, native Android applications, and Chrome extensions.

Prerequisites#
A Google Cloud project. Go to the Google Cloud Platform and create a new project if necessary.
Configuration#
To support Sign In with Google, you need to configure the Google provider for your Supabase project.


Web

Expo React Native

Flutter

Swift

Android (Kotlin)

Chrome Extensions
Configure OAuth credentials for your Google Cloud project in the Credentials page of the console. When creating a new OAuth client ID, choose Android or iOS depending on the mobile operating system your app is built for.
For Android, use the instructions on screen to provide the SHA-1 certificate fingerprint used to sign your Android app.
You will have a different set of SHA-1 certificate fingerprint for testing locally and going to production. Make sure to add both to the Google Cloud Console. and add all of the Client IDs to Supabase dashboard.
For iOS, use the instructions on screen to provide the app Bundle ID, and App Store ID and Team ID if the app is already published on the Apple App Store.
Configure the OAuth Consent Screen. This information is shown to the user when giving consent to your app. In particular, make sure you have set up links to your app's privacy policy and terms of service.
Finally, add the client ID from step 1 in the Google provider on the Supabase Dashboard, under Client IDs.
Note that you do not have to configure the OAuth flow in the Supabase Dashboard in order to use native sign in.

Signing users in#

Web

Expo React Native

Flutter

Android (Kotlin)

Chrome Extensions
Unlike the OAuth flow which requires the use of a web browser, the native Sign in with Google flow on Android uses the operating system's built-in functionalities to prompt the user for consent. Note that native sign-in has been rebranded as One Tap sign-in on Android by Google, which you should not confuse with One Tap sign in for web, as mentioned below.

When the user provides consent, Google issues an identity token (commonly abbreviated as ID token) that is then sent to your project's Supabase Auth server. When valid, a new user session is started by issuing an access and refresh token from Supabase Auth.

By default, Supabase Auth implements nonce validation during the authentication flow. This can be disabled in production under Authentication > Providers > Google > Skip Nonce Check in the Dashboard, or when developing locally by setting auth.external.<provider>.skip_nonce_check. Only disable this if your client libraries cannot properly handle nonce verification.

When working with Expo, you can use the react-native-google-signin/google-signin library library to obtain an ID token that you can pass to supabase-js signInWithIdToken method.

Follow the Expo installation docs for installation and configuration instructions. See the supabase-js reference for instructions on initializing the supabase-js client in React Native.

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { supabase } from '../utils/supabase'
export default function () {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: 'YOUR CLIENT ID FROM GOOGLE CONSOLE',
  })
  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        try {
          await GoogleSignin.hasPlayServices()
          const userInfo = await GoogleSignin.signIn()
          if (userInfo.data.idToken) {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: userInfo.data.idToken,
            })
            console.log(error, data)
          } else {
            throw new Error('no ID token present!')
          }
        } catch (error: any) {
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // user cancelled the login flow
          } else if (error.code === statusCodes.IN_PROGRESS) {
            // operation (e.g. sign in) is in progress already
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            // play services not available or outdated
          } else {
            // some other error happened
          }
        }
      }}
    />
  )
}
Google consent screen#
Google Consent Screen

By default, the Google consent screen shows the root domain of the callback URL, where Google will send the authentication response. With Supabase Auth, it is your Supabase project's domain (https://<your-project-ref>.supabase.co).

If that is not preferable, you can use a Custom Domain with your Supabase project. You can use it as your project's domain when creating the Supabase client in your application and initiating the authentication flow. It will then show up in the Google consent screen. If you want your app name and the logo on the consent screen, you must submit your app to Google for verification.

Login with Apple

Supabase Auth supports using Sign in with Apple on the web and in native apps for iOS, macOS, watchOS or tvOS.

Overview#
To support Sign in with Apple, you need to configure the Apple provider in the Supabase dashboard for your project.

There are three general ways to use Sign in with Apple, depending on the application you're trying to build:

Sign in on the web or in web-based apps
Using an OAuth flow initiated by Supabase Auth using the Sign in with Apple REST API.
Using Sign in with Apple JS directly in the browser, usually suitable for websites.
Sign in natively inside iOS, macOS, watchOS or tvOS apps using Apple's Authentication Services
In some cases you're able to use the OAuth flow within web-based native apps such as with React Native, Expo or other similar frameworks. It is best practice to use native Sign in with Apple capabilities on those platforms instead.

When developing with Expo, you can test Sign in with Apple via the Expo Go app, in all other cases you will need to obtain an Apple Developer account to enable the capability.


Web

Expo React Native

Flutter

Swift

Kotlin
Using native sign in with Apple in Expo#
When working with Expo, you can use the Expo AppleAuthentication library to obtain an ID token that you can pass to supabase-js signInWithIdToken method.

Follow the Expo docs for installation and configuration instructions. See the supabase-js reference for instructions on initializing the supabase-js client in React Native.

./components/Auth.native.tsx
import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from 'app/utils/supabase'
export function Auth() {
  if (Platform.OS === 'ios')
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 200, height: 64 }}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            })
            // Sign in via Supabase Auth.
            if (credential.identityToken) {
              const {
                error,
                data: { user },
              } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
              })
              console.log(JSON.stringify({ error, user }, null, 2))
              if (!error) {
                // User is signed in.
              }
            } else {
              throw new Error('No identityToken.')
            }
          } catch (e) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      />
    )
  return <>{/* Implement Android Auth options. */}</>
}
When working with bare React Native, you can use invertase/react-native-apple-authentication to obtain the ID token.

Configuration #
When testing with Expo Go, the Expo App ID host.exp.Exponent will be used. Make sure to add this to the "Client IDs" list in your Supabase dashboard Apple provider configuration!

When testing with Expo development build with custom bundleIdentifier, for example com.example.app , com.example.app.dev , com.example.app.preview. Make sure to add all these variants to the "Client IDs" list in your Supabase dashboard Apple provider configuration!

Have an App ID which uniquely identifies the app you are building. You can create a new App ID from the Identifiers section in the Apple Developer Console (use the filter menu in the upper right side to see all App IDs). These usually are a reverse domain name string, for example com.example.app. Make sure you configure Sign in with Apple for the App ID you created or already have, in the Capabilities list. At this time Supabase Auth does not support Server-to-Server notification endpoints, so you should leave that setting blank. (In the past App IDs were referred to as bundle IDs.)
Register all of the App IDs that will be using your Supabase project in the Apple provider configuration in the Supabase dashboard under Client IDs.
If you're building a native app only, you do not need to configure the OAuth settings.

Login with Twitter

To enable Twitter Auth for your project, you need to set up a Twitter OAuth application and add the application credentials in the Supabase Dashboard.

Overview#
Setting up Twitter logins for your application consists of 3 parts:

Create and configure a Twitter Project and App on the Twitter Developer Dashboard.
Add your Twitter API Key and API Secret Key to your Supabase Project.
Add the login code to your Supabase JS Client App.
Access your Twitter Developer account#
Go to developer.twitter.com.
Click on Sign in at the top right to log in.
Twitter Developer Portal.

Find your callback URL#
The next step requires a callback URL, which looks like this: https://<project-ref>.supabase.co/auth/v1/callback

Go to your Supabase Project Dashboard
Click on the Authentication icon in the left sidebar
Click on Providers under the Configuration section
Click on Twitter from the accordion list to expand and you'll find your Callback URL, you can click Copy to copy it to the clipboard
For testing OAuth locally with the Supabase CLI see the local development docs.

Create a Twitter OAuth app#
Click + Create Project.
Enter your project name, click Next.
Select your use case, click Next.
Enter a description for your project, click Next.
Enter a name for your app, click Next.
Copy and save your API Key (this is your client_id).
Copy and save your API Secret Key (this is your client_secret).
Click on App settings to proceed to next steps.
At the bottom, you will find User authentication settings. Click on Set up.
Under User authentication settings, you can configure App permissions.
Make sure you turn ON Request email from users.
Select Web App... as the Type of App.
Under App info configure the following.
Enter your Callback URL. Check the Find your callback URL section above to learn how to obtain your callback URL.
Enter your Website URL (tip: try http://127.0.0.1:port or http://www.localhost:port during development)
Enter your Terms of service URL.
Enter your Privacy policy URL.
Click Save.
Enter your Twitter credentials into your Supabase project#
Go to your Supabase Project Dashboard
In the left sidebar, click the Authentication icon (near the top)
Click on Providers under the Configuration section
Click on Twitter from the accordion list to expand and turn Twitter Enabled to ON
Enter your Twitter Client ID and Twitter Client Secret saved in the previous step
Click Save
You can also configure the Twitter auth provider using the Management API:

# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"
# Configure Twitter auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_twitter_enabled": true,
    "external_twitter_client_id": "your-twitter-api-key",
    "external_twitter_secret": "your-twitter-api-secret-key"
  }'
Add login code to your client app#

JavaScript

Flutter

Kotlin
Make sure you're using the right supabase client in the following code.

If you're not using Server-Side Rendering or cookie-based Auth, you can directly use the createClient from @supabase/supabase-js. If you're using Server-Side Rendering, see the Server-Side Auth guide for instructions on creating your Supabase client.

When your user signs in, call signInWithOAuth() with twitter as the provider:

async function signInWithTwitter() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
  })
}
For a PKCE flow, for example in Server-Side Auth, you need an extra step to handle the code exchange. When calling signInWithOAuth, provide a redirectTo URL which points to a callback route. This redirect URL should be added to your redirect allow list.


Client

Server
In the browser, signInWithOAuth automatically redirects to the OAuth provider's authentication endpoint, which then redirects to your endpoint.

await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo: `http://example.com/auth/callback`,
  },
})
At the callback endpoint, handle the code exchange to save the user session.


Next.js

SvelteKit

Astro

Remix

Express
Create a new file at app/auth/callback/route.ts and populate with the following:

app/auth/callback/route.ts
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

JavaScript

Flutter

Kotlin
When your user signs out, call signOut() to remove them from the browser session and any objects from localStorage:

async function signOut() {
  const { error } = await supabase.auth.signOut()
}
