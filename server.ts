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
interface User {
  state: UserState
  roomId?: string
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
    if (waitingPool.length < 2) {
      console.log("Not enough users to match.", { waiting: waitingPool.length })
      return
    }

    const user1Id = waitingPool.shift()!
    const user2Id = waitingPool.shift()!

    const user1 = users.get(user1Id)
    const user2 = users.get(user2Id)

    if (!user1 || !user2) {
      console.error("Could not find users from waiting pool.")
      return
    }

    const roomId = uuidv4()
    rooms.set(roomId, { users: [user1Id, user2Id] })

    user1.state = "IN_CHAT"
    user1.roomId = roomId
    user2.state = "IN_CHAT"
    user2.roomId = roomId

    console.log(`Match found! Room: ${roomId}, Users: [${user1Id}, ${user2Id}]`)

    io.to(user1Id).emit("match-found", { roomId, partnerId: user2Id, initiator: true })
    io.to(user2Id).emit("match-found", { roomId, partnerId: user1Id, initiator: false })
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

    // If user was in a chat, notify the partner and clean up
    if (user.state === "IN_CHAT" && user.roomId) {
      const room = rooms.get(user.roomId)
      if (room) {
        const partnerId = room.users.find(id => id !== socket.id)
        if (partnerId) {
          io.to(partnerId).emit("partner-disconnected")
          const partner = users.get(partnerId)
          if (partner) {
            partner.state = "IDLE"
            delete partner.roomId
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

    socket.on("start-searching", () => {
      const user = users.get(socket.id)
      if (user && user.state === "IDLE") {
        user.state = "SEARCHING"
        waitingPool.push(socket.id)
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

        // Reset skipper
        user.state = 'SEARCHING';
        delete user.roomId;
        waitingPool.push(socket.id);

        // Reset partner and prioritize them
        if (partner) {
            partner.state = 'SEARCHING';
            delete partner.roomId;
            waitingPool.unshift(partnerId); // Add to front of the queue
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

        // Reset partner's state to IDLE
        if (partner) {
            partner.state = 'IDLE';
            delete partner.roomId;
        }

        rooms.delete(roomId);
        console.log(`Room ${roomId} closed because a user stopped the chat.`);
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
