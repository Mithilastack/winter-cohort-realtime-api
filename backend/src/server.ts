import express, { Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { socketService } from "./service/socket.service";

const app = express();

// Create HTTP server
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// JSON middleware
app.use(express.json());

// URL-encoded middleware for form data
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Your routes will go here
// Example: app.use('/api', yourRouter);

// Initialize Socket.IO
socketService.initialize(httpServer);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO is ready for connections`);
});

export default app;
export { httpServer, socketService };
