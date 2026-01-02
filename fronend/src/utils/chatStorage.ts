import type { Chat, Message } from "../types/chat";

const STORAGE_KEY = "ai_assistant_chats";

// Generate unique ID
export const generateChatId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate chat title from first user message
export const generateChatTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find((msg) => msg.role === "user");
  if (!firstUserMessage) {
    return "New Chat";
  }
  const title = firstUserMessage.content.trim();
  return title.length > 50 ? title.substring(0, 50) + "..." : title;
};

// Get all chats from localStorage
export const getAllChats = (): { [id: string]: Chat } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading chats from localStorage:", error);
    return {};
  }
};

// Get specific chat by ID
export const getChat = (id: string): Chat | null => {
  const chats = getAllChats();
  return chats[id] || null;
};

// Create new chat
export const createChat = (): Chat => {
  const newChat: Chat = {
    id: generateChatId(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const chats = getAllChats();
  chats[newChat.id] = newChat;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Error saving new chat to localStorage:", error);
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("LocalStorage quota exceeded. Unable to create new chat.");
    }
  }

  return newChat;
};

// Update chat
export const updateChat = (id: string, messages: Message[]): void => {
  const chats = getAllChats();
  const chat = chats[id];

  if (!chat) {
    console.error(`Chat with id ${id} not found`);
    return;
  }

  chat.messages = messages;
  chat.updatedAt = Date.now();

  // Auto-update title if it's still "New Chat" and we have a user message
  if (chat.title === "New Chat" && messages.length > 0) {
    chat.title = generateChatTitle(messages);
  }

  chats[id] = chat;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Error updating chat in localStorage:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("LocalStorage quota exceeded. Unable to update chat.");
    }
  }
};

// Delete chat
export const deleteChat = (id: string): void => {
  const chats = getAllChats();
  delete chats[id];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Error deleting chat from localStorage:", error);
  }
};

// Clear all chats
export const clearAllChats = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing all chats from localStorage:", error);
  }
};

// Clear single chat's messages
export const clearChatMessages = (id: string): void => {
  const chats = getAllChats();
  const chat = chats[id];

  if (!chat) {
    console.error(`Chat with id ${id} not found`);
    return;
  }

  chat.messages = [];
  chat.title = "New Chat";
  chat.updatedAt = Date.now();
  chats[id] = chat;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Error clearing chat messages in localStorage:", error);
  }
};
