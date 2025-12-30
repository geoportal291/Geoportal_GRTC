import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_API_BASE || 'https://backend-solitary-fire-911.fly.dev';

export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket'], // Force WebSocket to avoid polling issues on Fly.io
    withCredentials: true
});
