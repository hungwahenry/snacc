Server-Side Rendering

How SSR works with Supabase Auth.

SSR frameworks move rendering and data fetches to the server, to reduce client bundle size and execution time.

Supabase Auth is fully compatible with SSR. You need to make a few changes to the configuration of your Supabase client, to store the user session in cookies instead of local storage. After setting up your Supabase client, follow the instructions for any flow in the How-To guides.

Make sure to use the PKCE flow instructions where those differ from the implicit flow instructions. If no difference is mentioned, don't worry about this.

@supabase/ssr#
We have developed an @supabase/ssr package to make setting up the Supabase client as simple as possible. This package is currently in beta. Adoption is recommended but be aware that the API is still unstable and may have breaking changes in the future.

If you're currently using the Auth Helpers package, the docs are still available, however we recommend migrating to the new @supabase/ssr package as this will be the recommended path moving forward.

Framework quickstarts#
Next.js
Next.js

Automatically configure Supabase in Next.js to use cookies, making your user and their session available on the client and server.
SvelteKit
SvelteKit

Automatically configure Supabase in SvelteKit to use cookies, making your user and their session available on the client and server.
