import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import routes from './routes/index.js';
import { setupSocketIO } from './services/socketService.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';

const app=express() // This is called Composition root of express lib
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});
// Setup socket handling
setupSocketIO(io);

// Make io available in req object for controllers
app.set('io', io);

// App Middlewares
app.use(express.json())
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"5mb"}))
app.use(express.urlencoded({extended:true,limit:"5mb"}))
app.use(cookieParser())

// Routes
app.use('/api', routes);

// 404 handler
app.use('/*splat', (req, res) => {
  res.status(404).json(new ApiResponse(404, null, `Route ${req.originalUrl} not found`));
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
  }
  
  // Handle mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    return res.status(400).json(new ApiResponse(400, null, `Validation Error: ${messages.join(', ')}`));
  }
  
  // Handle mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json(new ApiResponse(409, null, `${field} already exists`));
  }
  
  console.error(error);
  res.status(500).json(new ApiResponse(500, null, 'Internal Server Error'));
});

export { app, server };



