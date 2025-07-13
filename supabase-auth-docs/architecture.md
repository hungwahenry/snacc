Auth architecture

The architecture behind Supabase Auth.

There are four major layers to Supabase Auth:

Client layer. This can be one of the Supabase client SDKs, or manually made HTTP requests using the HTTP client of your choice.
Kong API gateway. This is shared between all Supabase products.
Auth service (formerly known as GoTrue).
Postgres database. This is shared between all Supabase products.
Diagram showing the architecture of Supabase. The Kong API gateway sits in front of 7 services: GoTrue, PostgREST, Realtime, Storage, pg_meta, Functions, and pg_graphql. All the services talk to a single Postgres instance.
Client layer#
The client layer runs in your app. This could be running in many places, including:

Your frontend browser code
Your backend server code
Your native application
The client layer provides the functions that you use to sign in and manage users. We recommend using the Supabase client SDKs, which handle:

Configuration and authentication of HTTP calls to the Supabase Auth backend
Persistence, refresh, and removal of Auth Tokens in your app's storage medium
Integration with other Supabase products
But at its core, this layer manages the making of HTTP calls, so you could write your own client layer if you wanted to.

See the Client SDKs for more information:

JavaScript
Flutter
Swift
Python
C#
Kotlin
Auth service#
The Auth service is an Auth API server written and maintained by Supabase. It is a fork of the GoTrue project, originally created by Netlify.

When you deploy a new Supabase project, we deploy an instance of this server alongside your database, and inject your database with the required Auth schema.

The Auth service is responsible for:

Validating, issuing, and refreshing JWTs
Serving as the intermediary between your app and Auth information in the database
Communicating with external providers for Social Login and SSO
Postgres#
Supabase Auth uses the auth schema in your Postgres database to store user tables and other information. For security, this schema is not exposed on the auto-generated API.

You can connect Auth information to your own objects using database triggers and foreign keys. Make sure that any views you create for Auth data are adequately protected by enabling RLS or revoking grants.

Make sure any views you create for Auth data are protected.

Starting in Postgres version 15, views inherit the RLS policies of the underlying tables if created with security_invoker. Views in earlier versions, or those created without security_invoker, inherit the permissions of the owner, who can bypass RLS policies.

