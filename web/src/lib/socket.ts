import { io } from 'socket.io-client';
import { BASE_URL } from './api';

export const socket = io(BASE_URL, { autoConnect: true });

socket.on('connect', () => {
  socket.emit('join:admins');
});
