import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the window.location object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'https://backend-weathered-silence-5682.fly.dev';

export const socket = io(URL, {
    autoConnect: false
});
