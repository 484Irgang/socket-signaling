import { Socket } from "socket.io";
import {
  addRoom,
  joinRoom,
  removeUserSocketFromRooms,
  store,
  updateCallUser,
} from "./store";
import { CallUser } from "./types/call";
import { Room } from "./types/room";

const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const path = require("path");

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
  let heartbeatCount: Record<string, number> = {};

  socket.on("create-room", (room: Omit<Room, "users" | "socket">) => {
    const newRoom = {
      ...room,
      users: [{ ...room.admin, socketId: socket.id }],
    };
    socket.join(room.id);
    store.dispatch(addRoom(newRoom));
  });

  socket.on(
    "request-join-room",
    ({ roomId, user }: { roomId: string; user: CallUser }) => {
      const room = store.getState().rooms[roomId];

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
        socket.emit("joined-room-successfully", room);
        return;
      }

      socket.join(roomId);
      store.dispatch(
        joinRoom({ roomId, user: { ...user, socketId: socket.id } })
      );

      socket.emit("joined-room-successfully", room);
    }
  );

  socket.on(
    "update-call-user",
    ({ roomId, user }: { roomId: string; user: CallUser }) => {
      const room = store.getState().rooms[roomId];

      if (!room?.id) {
        socket.send("Room not found");
        return;
      }

      const userInRoom = room.users?.some(
        (u) => !!user?.id && u?.id === user.id
      );

      if (!userInRoom) {
        return socket.send("User not included in the room");
      }

      store.dispatch(updateCallUser({ roomId, user }));
      if (user.joined) io.to(roomId).emit("user-updated", user);
    }
  );

  socket.on("disconnect", (reason) => {
    const rooms = store.getState().rooms;
    Object.values(rooms).forEach((room) => {
      const user = room.users.find((u) => u.socketId === socket.id);
      if (user) {
        io.to(room.id).emit("user-disconnected", user);
      }
    });

    store.dispatch(removeUserSocketFromRooms({ socketId: socket.id }));
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });

  socket.on("heartbeat", (roomId: string) => {
    if (!heartbeatCount[roomId]) {
      heartbeatCount[roomId] = 0;
    }
    if (heartbeatCount[roomId] === 2) {
      const room = store.getState().rooms[roomId];
      socket.emit("room-state", room?.id ? room : { error: "Room not found" });
      heartbeatCount[roomId] = 0;
    } else {
      heartbeatCount[roomId]++;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on port: ${PORT}`);
});
