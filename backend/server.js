const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

global.io = io;
app.set('io', io);

// Vercel may run multiple backend instances. Redis makes Socket.IO room
// broadcasts and presence work across those instances.
let realtimeError = null;
let redisClients = null;
const realtimeReady = (async () => {
    if (!process.env.REDIS_URL) {
        if (process.env.VERCEL_ENV) {
            throw new Error('REDIS_URL is required for Socket.IO on Vercel.');
        }
        return;
    }

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    redisClients = [pubClient, subClient];
    pubClient.on('error', (error) => console.error('[Redis] Publisher error:', error.message));
    subClient.on('error', (error) => console.error('[Redis] Subscriber error:', error.message));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
})().catch((error) => {
    realtimeError = error;
    console.error('[Realtime] Initialization failed:', error.message);
});

const isRealtimeReady = () => {
    if (realtimeError) return false;
    if (!process.env.REDIS_URL) return !process.env.VERCEL_ENV;
    return redisClients?.every((client) => client.isReady) === true;
};

const requireRealtime = async (_req, res, next) => {
    await realtimeReady;
    if (!isRealtimeReady()) {
        return res.status(503).json({ message: 'Realtime service is not ready.' });
    }
    next();
};

app.get('/health', async (_req, res) => {
    await realtimeReady;
    if (!isRealtimeReady()) {
        return res.status(503).json({ status: 'error', realtime: 'unavailable' });
    }
    res.json({ status: 'ok', realtime: process.env.REDIS_URL ? 'ready' : 'local-only' });
});

// Do not accept Socket.IO handshakes before the shared adapter is ready.
io.engine.use(async (_req, _res, next) => {
    await realtimeReady;
    if (!isRealtimeReady()) return next(new Error('Realtime service is not ready.'));
    next();
});


// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));

// SOS and other authenticated APIs emit realtime events, so they must wait
// until the cross-instance Socket.IO adapter is ready.
app.use('/api', requireRealtime);

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/map', require('./routes/map'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/welfare', require('./routes/welfare'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

require('./sockets')(io);

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// Vercel's Services runtime owns the HTTP listener and needs the server
// exported so it can handle both HTTP requests and Socket.IO upgrades.
module.exports = server;
