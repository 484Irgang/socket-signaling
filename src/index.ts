import { Socket } from "socket.io";
import { CallUser } from "./types/call";
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
  let heartbeatCount = 0;

  socket.on("create-room", (room: Omit<Room, "users" | "socket">) => {
    ROOMS[room.id] = {
      ...room,
      socket,
      users: [{ ...room.admin, socketId: socket.id }],
    };
    socket.join(room.id);
    console.log("Room created: ", ROOMS[room.id]);
  });

  socket.on(
    "request-join-room",
    ({ roomId, user }: { roomId: string; user: CallUser }) => {
      const room = ROOMS[roomId];

      console.log("Request to join room: ", { roomId, user, room });

      if (!room) {
        socket.send("Room not found");
        return;
      }

      const userInRoom = room.users?.some(
        (u) => !!user?.id && u?.id === user.id
      );

      if (userInRoom) {
        socket.emit("already-inside-room", { roomId, user });
        socket.emit(
          "joined-room-successfully",
          omit(room, ["socket", "users"])
        );
        return;
      }

      room.users.push({ ...user, socketId: socket.id });
      socket.join(roomId);

      if (room.socket?.id) room.socket.emit("new-user-joined-room", user);

      socket.emit("joined-room-successfully", omit(room, ["socket", "users"]));
    }
  );

  socket.on(
    "update-call-user",
    ({ roomId, userState }: { roomId: string; userState: CallUser }) => {
      const room = ROOMS[roomId];

      if (!room) {
        socket.send("Room not found");
        return;
      }

      const userInRoom = room.users?.some(
        (u) => !!userState?.id && u?.id === userState.id
      );

      if (!userInRoom) {
        return socket.send("User not included in the room");
      }

      const userIndex = room.users.findIndex((u) => u.id === userState.id);
      room.users[userIndex] = userState;

      io.to(roomId).emit("user-updated", userState);
    }
  );

  socket.on("disconnect", (reason) => {
    Object.keys(ROOMS).forEach((roomId) => {
      const room = ROOMS[roomId];
      if (room.socket.id === socket.id) {
        delete ROOMS[roomId];
      } else {
        ROOMS[roomId].users = room.users.filter(
          (u) => u.socketId !== socket.id
        );
        socket.leave(roomId);
      }
    });
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });

  socket.on("heartbeat", (roomId: string) => {
    if (heartbeatCount === 2) {
      const room = ROOMS[roomId];
      room.socket.emit(
        "room-state",
        room?.id ? omit(room, ["socket"]) : { error: "Room not found" }
      );
      heartbeatCount = 0;
    } else {
      heartbeatCount++;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on port: ${PORT}`);
});
