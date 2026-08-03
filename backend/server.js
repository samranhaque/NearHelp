const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();


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

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/map', require('./routes/map'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/welfare', require('./routes/welfare'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 5000;

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

global.io = io;
app.set('io', io);

require('./sockets')(io);

server.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🚀 Server running on port ${PORT}`);
    }
});
