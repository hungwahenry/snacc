Auth

Use Supabase to authenticate and authorize your users.

Supabase Auth makes it easy to implement authentication and authorization in your app. We provide client SDKs and API endpoints to help you create and manage users.

Your users can use many popular Auth methods, including password, magic link, one-time password (OTP), social login, and single sign-on (SSO).

About authentication and authorization#
Authentication and authorization are the core responsibilities of any Auth system.

Authentication means checking that a user is who they say they are.
Authorization means checking what resources a user is allowed to access.
Supabase Auth uses JSON Web Tokens (JWTs) for authentication. For a complete reference of all JWT fields, see the JWT Fields Reference. Auth integrates with Supabase's database features, making it easy to use Row Level Security (RLS) for authorization.

The Supabase ecosystem#
You can use Supabase Auth as a standalone product, but it's also built to integrate with the Supabase ecosystem.

Auth uses your project's Postgres database under the hood, storing user data and other Auth information in a special schema. You can connect this data to your own tables using triggers and foreign key references.

Auth also enables access control to your database's automatically generated REST API. When using Supabase SDKs, your data requests are automatically sent with the user's Auth Token. The Auth Token scopes database access on a row-by-row level when used along with RLS policies.

Providers#
Supabase Auth works with many popular Auth methods, including Social and Phone Auth using third-party providers. See the following sections for a list of supported third-party providers.

Social Auth#
Apple Icon
Apple
Azure (Microsoft) Icon
Azure (Microsoft)
Bitbucket Icon
Bitbucket
Discord Icon
Discord
Facebook Icon
Facebook
Figma Icon
Figma
GitHub Icon
GitHub
GitLab Icon
GitLab
Google Icon
Google
Kakao Icon
Kakao
Keycloak Icon
Keycloak
LinkedIn Icon
LinkedIn
Notion Icon
Notion
Slack Icon
Slack
Spotify Icon
Spotify
Twitter Icon
Twitter
Twitch Icon
Twitch
WorkOS Icon
WorkOS
Zoom Icon
Zoom
Phone Auth#
MessageBird Icon
MessageBird
Twilio Icon
Twilio
Vonage Icon
Vonage
Pricing#
Charges apply to Monthly Active Users (MAU), Monthly Active Third-Party Users (Third-Party MAU), and Monthly Active SSO Users (SSO MAU) and Advanced MFA Add-ons. For a detailed breakdown of how these charges are calculated, refer to the following pages:

Pricing MAU
Pricing Third-Party MAU
Pricing SSO MAU
Advanced MFA - Phone
