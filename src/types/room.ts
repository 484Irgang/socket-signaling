import { Socket } from "socket.io";

export type Room = {
  id: string;
  name: string;
  admin: {
    id: string;
    name: string;
  };
  insertedAt: string;
  users: string[];
  socket: Socket;
};
