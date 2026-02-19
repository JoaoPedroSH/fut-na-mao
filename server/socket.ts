import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { log } from "./index";

interface SessionTimer {
  startTime: number | null;
  durationAtStart: number;
  isRunning: boolean;
}

const timers: Record<string, SessionTimer> = {};

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
      
      // Send current server time state if it exists
      if (timers[sessionCode]) {
        socket.emit("timer-sync", timers[sessionCode]);
      }
    });

    socket.on("update-state", (data: { sessionCode: string; state: any }) => {
      // Broadcast the state update to everyone else in the room
      socket.to(data.sessionCode).emit("state-updated", data.state);
      
      // Sync timer state on server if phase changes
      const { sessionCode, state } = data;
      if (!timers[sessionCode]) {
        timers[sessionCode] = { startTime: null, durationAtStart: state.timer, isRunning: false };
      }

      const timer = timers[sessionCode];
      const isRunning = state.phase === 'playing';

      if (isRunning !== timer.isRunning) {
        if (isRunning) {
          timer.startTime = Date.now();
          timer.durationAtStart = state.timer;
        } else {
          timer.startTime = null;
          timer.durationAtStart = state.timer;
        }
        timer.isRunning = isRunning;
        io.to(sessionCode).emit("timer-sync", timer);
      }
    });

    socket.on("sync-timer", (data: { sessionCode: string, timerState: SessionTimer }) => {
      timers[data.sessionCode] = data.timerState;
      socket.to(data.sessionCode).emit("timer-sync", data.timerState);
    });

    socket.on("disconnect", () => {
      log(`Client disconnected: ${socket.id}`, "socket.io");
    });
  });

  return io;
}
