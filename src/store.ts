import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CallUser } from "./types/call";
import { Room } from "./types/room";

type Store = {
  rooms: Record<string, Room>;
  //   addRoom: (room: Room) => void;
  //   joinRoom: (roomId: string, user: CallUser) => void;
  //   updateCallUser: (roomId: string, userState: CallUser) => void;
  //   removeUserSocketFromRooms: (socketId: string) => void;
};

const initialState: Store = {
  rooms: {},
};

const storeSlice = createSlice({
  name: "rooms_store",
  initialState,
  reducers: {
    addRoom: (state, action: PayloadAction<Room>) => {
      state.rooms[action.payload.id] = action.payload;
    },
    joinRoom: (
      state,
      action: PayloadAction<{ roomId: string; user: CallUser }>
    ) => {
      const room = state.rooms[action.payload.roomId];
      if (room) {
        room.users.push(action.payload.user);
      }
    },
    updateCallUser: (
      state,
      action: PayloadAction<{ roomId: string; user: CallUser }>
    ) => {
      const room = state.rooms[action.payload.roomId];
      if (room) {
        const user = room.users.find((u) => u.id === action.payload.user.id);
        if (user) {
          Object.assign(user, action.payload.user);
        }
      }
    },
    removeUserSocketFromRooms: (
      state,
      action: PayloadAction<{ socketId: string }>
    ) => {
      for (const roomId in state.rooms) {
        const room = state.rooms[roomId];
        if (room) {
          room.users = room.users.filter(
            (u) => u.socketId !== action.payload.socketId
          );
        }
      }
    },
  },
});

export const { addRoom, joinRoom, updateCallUser, removeUserSocketFromRooms } =
  storeSlice.actions;

export const store = configureStore({
  reducer: storeSlice.reducer,
});
