# Development Plan for Watch

This document outlines the steps to build the Watch MVP, a real-time video chat platform.

### Phase 1: Project Foundation & Setup

1.  **Initialize Shadcn UI:**
    - Run the `shadcn-ui` init command to set up the component library.
    - Configure `tailwind.config.ts` and `globals.css` as required by Shadcn.

2.  **Set up Supabase:**
    - Install the `@supabase/supabase-js` client library.
    - Create a new project on the Supabase dashboard.
    - Create a `.env.local` file and add the Supabase Project URL and Anon Key.
    - Implement a Supabase client helper in `lib/supabase/client.ts` for the browser client and `lib/supabase/server.ts` for server-side operations.

3.  **Set up Zustand for State Management:**
    - Install the `zustand` library.
    - Create an authentication store (`stores/use-auth-store.ts`) to manage user session state, profile information, and loading status.

### Phase 2: User Authentication

1.  **Database Schema:**
    - In the Supabase dashboard, create a `profiles` table.
    - Columns: `id` (UUID, foreign key to `auth.users.id`), `username` (text), `avatar_url` (text), `created_at` (timestampz).
    - Enable Row Level Security (RLS) on the `profiles` table to ensure users can only access and manage their own data.

2.  **Authentication UI:**
    - Create a new route and page for login/signup at `app/auth/page.tsx`.
    - Build a reusable authentication form component (`components/auth/auth-form.tsx`) using Shadcn UI components (`Card`, `Input`, `Button`, `Label`).
    - The form will handle both sign-in and sign-up with email and password.

3.  **Authentication Logic:**
    - Implement sign-up, sign-in, and sign-out functions that call the Supabase client.
    - Use the Zustand store to reflect the user's authentication state across the application.
    - Implement a listener for Supabase's `onAuthStateChange` to automatically update the Zustand store and manage session persistence.

4.  **Protected Routes & User Session:**
    - Create a component or logic in the root layout (`app/layout.tsx`) to manage redirects based on authentication state.
    - Unauthenticated users trying to access protected pages should be redirected to `/auth`.
    - Authenticated users trying to access the `/auth` page should be redirected to the main dashboard/chat page.

### Phase 3: Core Video Chat Functionality (High-Level)

1.  **Signaling Server Setup:**
    - Install `socket.io` and `socket.io-client`.
    - Create a Socket.IO server instance, likely attached to the Next.js custom server or handled via API routes (`app/api/socket/route.ts`).

2.  **WebRTC Implementation:**
    - Develop a client-side WebRTC service/hook (`hooks/use-webrtc.ts`) to manage peer-to-peer connections.
    - This hook will handle signaling (offers, answers, ICE candidates) via the Socket.IO server.

3.  **Video Chat UI:**
    - Design the main chat interface at `app/chat/page.tsx`.
    - Include `<video>` elements for local and remote streams.
    - Implement "Next" and "Skip" buttons to control the matching process.

### Phase 4: Future Features

- User Profile Management (update username, upload avatar).
- Friend List Implementation.
- Group Video Calls with MediaSoup.
- Text Chat.
