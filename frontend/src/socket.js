import { io } from 'socket.io-client';
import { API_BASE_URL } from './api/config';

const URL = API_BASE_URL;

export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket'], // Force WebSocket to avoid polling issues on Fly.io
    withCredentials: true
});
