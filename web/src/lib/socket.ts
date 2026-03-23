import { io } from 'socket.io-client';

export const socket = io('http://localhost:3333', { autoConnect: true });

socket.on('connect', () => {
  socket.emit('join:admins');
});
