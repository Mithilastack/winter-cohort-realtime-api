import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { openai } from "./openai.service";

class SocketService {
  private io: Server | null = null;

  /**
   * Initialize Socket.IO server with HTTP server
   */
  initialize(httpServer: HTTPServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:5173"],
        credentials: true,
        methods: ["GET", "POST"],
      },
    });

    this.setupEventHandlers();
    console.log("✅ Socket.IO initialized successfully");

    return this.io;
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): Server {
    if (!this.io) {
      throw new Error(
        "Socket.IO has not been initialized. Call initialize() first."
      );
    }
    return this.io;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
      });

      // Handle chat messages with OpenAI streaming
      socket.on("chat-message", async (data: { prompt: string }) => {
        try {
          console.log(`💬 Chat message from ${socket.id}:`, data.prompt);

          // Create streaming chat completion
          const stream = await openai.responses.create({
            model: "gpt-4o-mini",
            input: data.prompt,
            stream: true,
          });

          let fullResponse = [];

          // Stream the response back to the client
          for await (const chunk of stream) {
            if (chunk.type === "response.output_text.delta") {
              fullResponse.push(chunk.delta);
              socket.emit("chat-stream", { content: chunk.delta });
            }
          }

          // Send completion event
          socket.emit("chat-complete", { fullResponse: fullResponse.join("") });
          console.log(`✅ Chat completed for ${socket.id}`);
        } catch (error: any) {
          console.error(`❌ Chat error for ${socket.id}:`, error.message);
          socket.emit("chat-error", {
            error:
              error.message ||
              "An error occurred while processing your request",
          });
        }
      });

      // Example: Echo message event
      socket.on("message", (data) => {
        console.log("📩 Received message:", data);
        socket.emit("message", { echo: data });
      });

      // Example: Broadcast to all clients
      socket.on("broadcast", (data) => {
        console.log("📢 Broadcasting:", data);
        this.io?.emit("broadcast", data);
      });

      // Example: Join a room
      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
        console.log(`🚪 Client ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit("user-joined", { socketId: socket.id });
      });

      // Example: Leave a room
      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId);
        console.log(`🚪 Client ${socket.id} left room: ${roomId}`);
        socket.to(roomId).emit("user-left", { socketId: socket.id });
      });

      // Example: Send message to a specific room
      socket.on(
        "room-message",
        ({ roomId, message }: { roomId: string; message: any }) => {
          console.log(`📩 Room message to ${roomId}:`, message);
          this.io
            ?.to(roomId)
            .emit("room-message", { from: socket.id, message });
        }
      );
    });
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: string, data: any): void {
    if (!this.io) {
      throw new Error("Socket.IO has not been initialized.");
    }
    this.io.emit(event, data);
  }

  /**
   * Emit event to a specific room
   */
  emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      throw new Error("Socket.IO has not been initialized.");
    }
    this.io.to(room).emit(event, data);
  }

  /**
   * Emit event to a specific socket
   */
  emitToSocket(socketId: string, event: string, data: any): void {
    if (!this.io) {
      throw new Error("Socket.IO has not been initialized.");
    }
    this.io.to(socketId).emit(event, data);
  }
}

// Export singleton instance
export const socketService = new SocketService();
