import { create } from "zustand"
import io, { Socket } from "socket.io-client"

interface SocketState {
  socket: Socket | null
  connect: () => void
  disconnect: () => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connect: () => {
    // Avoid creating a new connection if one already exists
    if (get().socket) {
      return
    }

    const newSocket = io()

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id)
      set({ socket: newSocket })
    })

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected.")
      set({ socket: null })
    })

    // Set the socket immediately for initial state, even before 'connect' event
    set({ socket: newSocket })
  },
  disconnect: () => {
    get().socket?.disconnect()
    set({ socket: null })
  },
}))
