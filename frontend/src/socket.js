import { io } from 'socket.io-client';

const URL = 'https://backend-blue-shape-6900.fly.dev';

export const socket = io(URL, {
    autoConnect: false
});
