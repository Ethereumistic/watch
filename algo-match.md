Matching Algorithm & System Design: algo-match.md
This document outlines the plan for a robust, room-based matching algorithm for a real-time video chat application.

1. Core Concepts & Server-Side State
The entire matching logic will be orchestrated by the central server.ts file using Socket.IO. The server will maintain the state of all users and rooms in memory.

User States
Every user connected to the server will be in one of three states:

IDLE: The user is connected to the platform but is not actively searching for a partner. This is the default state upon connection.

SEARCHING: The user has initiated a search and is waiting to be matched.

IN_CHAT: The user is currently in a room and connected with a partner.

Server-Side Data Structures (server.ts)
To manage the state efficiently, we will use the following data structures:

users: A Map to store the state of every connected user.

key: socket.id (string)

value: { state: 'IDLE' | 'SEARCHING' | 'IN_CHAT', roomId?: string }

waitingPool: An array acting as a First-In-First-Out (FIFO) queue. It will only store the socket.id of users in the SEARCHING state. This is more efficient than creating "half-empty" rooms.

Example: ['socket_id_of_user_A', 'socket_id_of_user_C']

rooms: A Map to store active chat rooms.

key: roomId (a unique string, e.g., generated with uuid)

value: { users: [socket.id, socket.id] }

2. Matching Flow: The "Happy Path"
This describes the process of two users successfully connecting for the first time.

User A Connects:

Client (/watch/page.tsx): Establishes a Socket.IO connection.

Server (server.ts): On the connection event, the server adds User A to the users map with the state IDLE.

users.set(socket.id, { state: 'IDLE' });

User A Starts Searching:

Client (/watch/page.tsx): User A clicks the "Start" button. The client emits a start-searching event.

Server (server.ts):
a.  Receives start-searching.
b.  Updates User A's state to SEARCHING.
c.  Adds User A's socket.id to the end of the waitingPool.
d.  Checks the waitingPool: The pool now has 1 user. No match can be made yet. User A waits.

User B Starts Searching:

Client (/watch/page.tsx): User B connects and clicks "Start". The client emits start-searching.

Server (server.ts):
a.  Receives start-searching from User B.
b.  Updates User B's state to SEARCHING.
c.  Adds User B's socket.id to the waitingPool.
d.  Checks the waitingPool: The pool now has 2+ users ([A, B]). A match can be made!

Creating the Match:

Server (server.ts):
a.  Pulls the first two users from the waitingPool (User A and User B).
b.  Generates a unique roomId.
c.  Creates a new room in the rooms map: rooms.set(roomId, { users: [A.id, B.id] });
d.  Updates the state for both User A and User B to IN_CHAT and adds the roomId.
e.  Emits a match-found event to both User A and User B, sending the necessary information for them to establish a peer-to-peer connection.
typescript // Example payload for the 'match-found' event { roomId: 'unique-room-id', partnerId: 'partner-socket-id', initiator: boolean // true for one user, false for the other } 

Initiating Peer Connection:

Client (hooks/useWebRTC.ts): Both clients receive the match-found event. The hook uses this data to start the WebRTC handshake (creating offers, answers, and exchanging ICE candidates), relayed via the server.

3. Skip & Re-match Flow (Optimized)
This flow ensures a fast and fluid experience, especially for the user who didn't initiate the skip.

Scenario: User A and User B are IN_CHAT. User C is SEARCHING and is in the waitingPool.

User A Skips:

Client (/watch/page.tsx): User A clicks "Skip". The client emits a skip-chat event.

Server (server.ts):
a.  Receives skip-chat from User A.
b.  Looks up User A in the users map to find their roomId.
c.  Retrieves the room from the rooms map and identifies the partner, User B.
d.  Emits a partner-disconnected event to User B.
e.  Cleans up: Destroys the room by deleting it from the rooms map.

Handling the Skipped Users:

Server (server.ts):
a.  User A (The Skipper):
-   Their state is set back to SEARCHING.
-   Their socket.id is added to the end of the waitingPool. This naturally creates a small "penalty" as they are now last in line.
-   The server runs the matching logic again for the waitingPool.

b.  User B (The Skipped):
-   Their state is also set back to SEARCHING.
-   Crucially, their socket.id is added to the front of the waitingPool.
-   The server immediately runs the matching logic. Since User B is now at the front and User C is waiting, they are instantly matched.

Result:

User A is back to searching.

User B is instantly connected with User C, providing a seamless transition instead of being sent back to a loading screen.

4. Disconnect Handling (Edge Case)
This is critical for a robust system.

Scenario: User A and User B are IN_CHAT. User A suddenly closes their browser tab.

Server (server.ts):

The built-in disconnect event fires for User A's socket.

The server logic is nearly identical to the "Skip" flow:
a.  Look up the disconnecting user (User A) to see if they were IN_CHAT.
b.  If so, find their roomId and their partner (User B).
c.  Emit partner-disconnected to User B.
d.  Clean up the user from the users map and destroy the room.
e.  Immediately attempt to re-match User B by placing them at the front of the waitingPool.

5. File-by-File Responsibility Breakdown
server.ts:

Owner of State: Manages users, waitingPool, and rooms.

Orchestrator: Handles all socket events (connection, disconnect, start-searching, skip-chat).

Matchmaker: Implements the core matching, skipping, and re-matching logic.

Signaling Relay: Relays WebRTC signaling messages (offer, answer, ice-candidate) between peers in a room without interpreting them.

/watch/page.tsx:

UI Controller: Manages the main UI state (e.g., showing "Connecting...", "Searching...", or the video feeds).

User Actions: Contains the "Start" and "Skip" buttons. On click, it emits the corresponding events to the server.

Component Wrapper: Renders <VideoFeed /> and passes down the streams from the WebRTC hook.

Socket Manager: Initializes and manages the lifecycle of the socket connection.

components/VideoFeed.tsx:

Display Component: Purely for presentation. It will contain two <video> elements.

Props: Receives localStream and remoteStream from /watch/page.tsx.

Sets muted on the local video element to prevent audio feedback.

hooks/useWebRTC.ts:

WebRTC Logic: Encapsulates all RTCPeerConnection logic.

Socket Listener: Listens for WebRTC-specific events from the server (match-found, partner-disconnected, signaling events).

Stream Management: Handles navigator.mediaDevices.getUserMedia to get the local video/audio. Manages the state for localStream and remoteStream.

Peer Connection Lifecycle: Creates/closes the peer connection in response to server events.