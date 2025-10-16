import { io, Socket } from 'socket.io-client';
import { ENV } from './env';

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    socket = io(ENV.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
