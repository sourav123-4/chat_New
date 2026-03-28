import { io, Socket } from "socket.io-client";
import { store } from "../../store";

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket) return socket;

  const token = store.getState().auth.token;

  socket = io("https://7d7b49e37a42.ngrok-free.app", {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
