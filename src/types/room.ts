import { CallUser } from "./call";

export type Room = {
  id: string;
  name: string;
  admin: CallUser;
  insertedAt: string;
  users: CallUser[];
};
