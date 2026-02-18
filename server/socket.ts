import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { log } from "./index";

export function setupWebSockets(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    log(`New client connected: ${socket.id}`, "socket.io");

    socket.on("join-session", (sessionCode: string) => {
      socket.join(sessionCode);
      log(`Client ${socket.id} joined session: ${sessionCode}`, "socket.io");
    });

    socket.on("update-state", (data: { sessionCode: string; state: any }) => {
      // Broadcast the state update to everyone else in the room
      socket.to(data.sessionCode).emit("state-updated", data.state);
    });

    socket.on("disconnect", () => {
      log(`Client disconnected: ${socket.id}`, "socket.io");
    });
  });

  return io;
}
