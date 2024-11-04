import { Socket } from "socket.io";
import { CallSession } from "./types/call";
import { Room } from "./types/room";
import { omit } from "./utils";

const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const path = require("path");

const ROOMS: { [roomId: string]: Room } = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const HOST = "127.0.0.1";
const PORT = 8080;

app.use(express.static(path.resolve("./public")));

app.get("/health", (_, res) => {
  res.send("Status: OK");
});

io.on("connection", (socket: Socket) => {
  console.log("A user connected: ", socket.id);

  socket.on("create-room", (room: Omit<Room, "users" | "socket">) => {
    ROOMS[room.id] = { ...room, socket, users: [room.admin.id], sessions: [] };
    socket.join(room.id);
    console.log("Room created: ", room);
  });

  socket.on(
    "request-join-room",
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      const room = ROOMS[roomId];

      console.log("Request to join room: ", { roomId, userId, room });

      if (!room) {
        socket.send("Room not found");
        return;
      }

      if (room.users.includes(userId)) {
        socket.emit("already-inside-room", userId);
        socket.emit(
          "joined-room-successfully",
          omit(room, ["socket", "users"])
        );
        return;
      }

      room.users.push(userId);
      socket.join(roomId);
      room.socket.emit("new-user-joined-room", userId);
      socket.emit(
        "joined-room-successfully",
        omit(room, ["socket", "users", "sessions"])
      );
      console.log("User joined room: ", { roomId, userId });
    }
  );

  socket.on(
    "share-call-session",
    ({
      roomId,
      userId,
      session,
    }: {
      roomId: string;
      userId: string;
      session: CallSession;
    }) => {
      const room = ROOMS[roomId];

      console.log("Share call session: ", { roomId, userId, session });

      if (!room) {
        socket.send("Room not found");
        return;
      }

      if (!room.users.includes(userId)) {
        socket.send("User not included in the room");
      }

      socket.emit(
        "receive-all-room-sessions",
        room.sessions?.filter((s) => s.id !== session.id)
      );
      if (!room.sessions.some((s) => s.id === session.id))
        room.sessions.push(session);
      socket.to(roomId).emit("receive-call-session", session);
    }
  );
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on port: ${PORT}`);
});
