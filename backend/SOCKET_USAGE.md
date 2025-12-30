# Socket.IO Service Usage Guide

## Overview

The Socket.IO service is integrated with your Express application and provides real-time bidirectional communication capabilities.

## Features

### 1. **Connection Management**

- Automatic connection/disconnection logging
- Client tracking with socket IDs

### 2. **Room Management**

- Join/leave rooms for group communications
- Send messages to specific rooms

### 3. **Broadcasting**

- Send messages to all connected clients
- Send messages to specific rooms or sockets

## Client-Side Events

### Available Events to Emit from Client:

```javascript
// Send a message (will be echoed back)
socket.emit("message", { text: "Hello Server!" });

// Broadcast to all clients
socket.emit("broadcast", { data: "This goes to everyone" });

// Join a room
socket.emit("join-room", "room-123");

// Leave a room
socket.emit("leave-room", "room-123");

// Send message to a specific room
socket.emit("room-message", {
  roomId: "room-123",
  message: "Hello room!",
});
```

### Available Events to Listen from Server:

```javascript
// Echo response
socket.on("message", (data) => {
  console.log("Received:", data);
});

// Broadcast message
socket.on("broadcast", (data) => {
  console.log("Broadcast:", data);
});

// User joined room
socket.on("user-joined", (data) => {
  console.log("User joined:", data.socketId);
});

// User left room
socket.on("user-left", (data) => {
  console.log("User left:", data.socketId);
});

// Room message
socket.on("room-message", (data) => {
  console.log("From:", data.from, "Message:", data.message);
});
```

## Server-Side Usage

### Import the service:

```typescript
import { socketService } from "./service/socket.service";
```

### Emit to all clients:

```typescript
socketService.emitToAll("notification", {
  message: "System update available",
});
```

### Emit to a specific room:

```typescript
socketService.emitToRoom("room-123", "update", {
  data: "New data for this room",
});
```

### Emit to a specific socket:

```typescript
socketService.emitToSocket("socket-id-here", "private-message", {
  message: "Just for you",
});
```

## Example: Using Socket.IO in a Controller

```typescript
import { Request, Response } from "express";
import { socketService } from "../service/socket.service";

export const notifyUsers = (req: Request, res: Response) => {
  const { message } = req.body;

  // Send notification to all connected clients
  socketService.emitToAll("notification", { message });

  res.json({ success: true, message: "Notification sent" });
};
```

## Frontend Example (React/Vue/Plain JS)

```typescript
import { io } from "socket.io-client";

// Connect to the server
const socket = io("http://localhost:3000", {
  withCredentials: true,
});

// Listen for connection
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

// Listen for messages
socket.on("message", (data) => {
  console.log("Received message:", data);
});

// Send a message
socket.emit("message", { text: "Hello from client!" });

// Join a room
socket.emit("join-room", "chat-room-1");

// Listen for disconnection
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

## CORS Configuration

The service is configured to accept connections from:

- `http://localhost:5173` (your frontend)

To add more origins, update the `cors.origin` array in `socket.service.ts`.

## Customization

To add new socket events, edit the `setupEventHandlers()` method in `socket.service.ts`:

```typescript
// Add this inside setupEventHandlers()
socket.on("your-custom-event", (data) => {
  console.log("Custom event received:", data);
  // Your logic here
  socket.emit("your-response-event", { response: "data" });
});
```
