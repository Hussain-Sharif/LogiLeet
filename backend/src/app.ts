import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import connectionDB from './db/connection.js';
import authRoutes from './routes/auth.js';
import deliveryRoutes from './routes/deliveries.js';
import trackingRoutes from './routes/tracking.js';
import vehicleRoutes from './routes/vehicles.js';
import adminRoutes from './routes/admin.js';

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Enable both transports
});

// Increase body size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join delivery rooms
  socket.on('join-delivery', (deliveryId) => {
    socket.join(`delivery-${deliveryId}`);
    console.log(`📦 Socket ${socket.id} joined delivery room: ${deliveryId}`);
  });

  // Join user rooms
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`👤 Socket ${socket.id} joined room: ${roomId}`);
  });

  // Handle driver location updates
  socket.on('driver-location-update', (data) => {
    console.log('📍 Driver location update:', data);
    socket.to(`delivery-${data.deliveryId}`).emit('location-update', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', socketConnected: io.engine.clientsCount });
});

// Connect to MongoDB
connectionDB();

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
});

export { io ,app,server};
