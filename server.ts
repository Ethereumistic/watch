import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server, Socket } from "socket.io"
import { v4 as uuidv4 } from "uuid"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// --- Types ---
type UserState = "IDLE" | "SEARCHING" | "IN_CHAT"

// Profile type - must match the structure sent from the client
type Profile = {
  username: string | null;
  avatar_url?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'couple';
};

interface User {
  state: UserState
  roomId?: string
  profile?: Profile
}

// --- Server State ---
const users = new Map<string, User>()
const waitingPool: string[] = []
const rooms = new Map<string, { users: [string, string] }>()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer)

  const tryMatch = () => {
    // A loop to handle multiple potential matches at once
    while (waitingPool.length >= 2) {
      const user1Id = waitingPool.shift()!
      const user2Id = waitingPool.shift()!

      const user1 = users.get(user1Id)
      const user2 = users.get(user2Id)

      // If a user disconnected while in the pool, continue to the next iteration
      if (!user1 || user1.state !== 'SEARCHING') {
        if(user2Id) waitingPool.unshift(user2Id) // put user2 back
        continue;
      }
       if (!user2 || user2.state !== 'SEARCHING') {
        if(user1Id) waitingPool.unshift(user1Id) // put user1 back
        continue;
      }

      const roomId = uuidv4()
      rooms.set(roomId, { users: [user1Id, user2Id] })

      user1.state = "IN_CHAT"
      user1.roomId = roomId
      user2.state = "IN_CHAT"
      user2.roomId = roomId

      console.log(`Match found! Room: ${roomId}, Users: [${user1Id}, ${user2Id}]`)

      // Exchange profile information
      io.to(user1Id).emit("match-found", { roomId, partnerId: user2Id, initiator: true, partnerProfile: user2.profile })
      io.to(user2Id).emit("match-found", { roomId, partnerId: user1Id, initiator: false, partnerProfile: user1.profile })
    }
  }

  const handleDisconnect = (socket: Socket) => {
    const user = users.get(socket.id)
    if (!user) return

    console.log(`User disconnected: ${socket.id}, State: ${user.state}`)

    // If user was in the waiting pool, remove them
    const waitingIndex = waitingPool.indexOf(socket.id)
    if (waitingIndex > -1) {
      waitingPool.splice(waitingIndex, 1)
    }

    // If user was in a chat, notify the partner and put them back in the queue
    if (user.state === "IN_CHAT" && user.roomId) {
      const room = rooms.get(user.roomId)
      if (room) {
        const partnerId = room.users.find(id => id !== socket.id)
        if (partnerId) {
          io.to(partnerId).emit("partner-disconnected")
          const partner = users.get(partnerId)
          if (partner) {
            partner.state = "SEARCHING"
            delete partner.roomId
            waitingPool.unshift(partnerId) // Prioritize the partner
            io.to(partnerId).emit("auto-searching") // Tell client to update UI
            tryMatch()
          }
        }
        rooms.delete(user.roomId)
      }
    }

    users.delete(socket.id)
  }

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id)
    users.set(socket.id, { state: "IDLE" })

    socket.on("start-searching", ({ profile }: { profile: Profile }) => {
      const user = users.get(socket.id)
      if (user && (user.state === "IDLE" || user.state === "SEARCHING")) { // Allow re-triggering search
        user.state = "SEARCHING"
        user.profile = profile // Store the profile
        // Avoid adding duplicates to the waiting pool
        if (!waitingPool.includes(socket.id)) {
            waitingPool.push(socket.id)
        }
        console.log(`User ${socket.id} is now searching. Waiting pool: ${waitingPool.length}`)
        tryMatch()
      }
    })

    socket.on("stop-searching", () => {
      const user = users.get(socket.id)
      if (user && user.state === "SEARCHING") {
        const index = waitingPool.indexOf(socket.id)
        if (index > -1) {
          waitingPool.splice(index, 1)
        }
        user.state = "IDLE"
        console.log(`User ${socket.id} stopped searching. Waiting pool: ${waitingPool.length}`)
      }
    })

    socket.on("skip-chat", () => {
        const user = users.get(socket.id)
        if (!user || user.state !== 'IN_CHAT' || !user.roomId) return

        const roomId = user.roomId
        const room = rooms.get(roomId)
        if (!room) return

        const partnerId = room.users.find(id => id !== socket.id)!
        const partner = users.get(partnerId)

        // Notify partner
        io.to(partnerId).emit('partner-disconnected');

        // Reset skipper to searching (and add to back of queue)
        user.state = 'SEARCHING';
        delete user.roomId;
        if (!waitingPool.includes(socket.id)) {
            waitingPool.push(socket.id);
        }
        io.to(socket.id).emit("auto-searching");


        // Reset partner and prioritize them
        if (partner) {
            partner.state = 'SEARCHING';
            delete partner.roomId;
            if (!waitingPool.includes(partnerId)) {
                waitingPool.unshift(partnerId); 
            }
            io.to(partnerId).emit("auto-searching");
        }

        rooms.delete(roomId);
        console.log(`Room ${roomId} closed due to skip.`)
        tryMatch();
    });

    socket.on("stop-chat", () => {
        const user = users.get(socket.id);
        if (!user || user.state !== 'IN_CHAT' || !user.roomId) return;

        const roomId = user.roomId;
        const room = rooms.get(roomId);
        if (!room) return;

        const partnerId = room.users.find(id => id !== socket.id)!;
        const partner = users.get(partnerId);

        // Notify partner that chat has ended
        io.to(partnerId).emit('partner-disconnected');

        // Reset stopper's state to IDLE
        user.state = 'IDLE';
        delete user.roomId;
        console.log(`User ${socket.id} stopped chat and is now IDLE.`);

        // Reset partner's state to SEARCHING and prioritize them
        if (partner) {
            partner.state = 'SEARCHING';
            delete partner.roomId;
            if (!waitingPool.includes(partnerId)) {
                waitingPool.unshift(partnerId);
            }
            io.to(partnerId).emit("auto-searching");
            console.log(`Partner ${partnerId} was put back into searching.`);
        }

        rooms.delete(roomId);
        console.log(`Room ${roomId} closed because a user stopped the chat.`);
        tryMatch();
    });

    socket.on("disconnect", () => handleDisconnect(socket))

    // --- WebRTC Signaling Relay ---
    socket.on("offer", (data) => {
      io.to(data.partnerId).emit("offer", { sdp: data.sdp, senderId: socket.id })
    })

    socket.on("answer", (data) => {
      io.to(data.partnerId).emit("answer", { sdp: data.sdp, senderId: socket.id })
    })

    socket.on("ice-candidate", (data) => {
      io.to(data.partnerId).emit("ice-candidate", { candidate: data.candidate, senderId: socket.id })
    })

    socket.on("chat-message", (data) => {
      const user = users.get(socket.id)
      if (user && user.state === "IN_CHAT" && data.partnerId) {
        io.to(data.partnerId).emit("chat-message", { message: data.message, from: socket.id })
      }
    })
  })

  httpServer
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
    .on("error", (err) => {
      console.error("Server error:", err)
      process.exit(1)
    })
})


// Graceful shutdown
process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully.');
    // Here you could add cleanup logic, like notifying all connected clients
    process.exit(0);
});

