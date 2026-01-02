import { createContext, useContext, useState, type ReactNode } from "react";
import type { Chat, Message, ChatContextType } from "../types/chat";
import {
  getAllChats,
  createChat,
  updateChat,
  deleteChat as deleteStoredChat,
  clearChatMessages,
  generateChatId,
} from "../utils/chatStorage";

// Extended context type with internal methods
interface ExtendedChatContextType extends ChatContextType {
  finalizeStreamingMessage: (fullResponse: string) => void;
}

const ChatContext = createContext<ExtendedChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  // Use lazy initialization to avoid setState in useEffect
  const [chats, setChats] = useState<{ [id: string]: Chat }>(() => {
    const storedChats = getAllChats();
    const chatIds = Object.keys(storedChats);

    if (chatIds.length === 0) {
      // No chats exist, create initial chat
      const initialChat = createChat();
      return { [initialChat.id]: initialChat };
    }
    return storedChats;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const chatIds = Object.keys(chats);
    if (chatIds.length === 0) return null;

    // Set most recently updated chat as active
    const sortedChats = chatIds.sort(
      (a, b) => chats[b].updatedAt - chats[a].updatedAt
    );
    return sortedChats[0];
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Get current chat messages
  const messages: Message[] =
    activeChatId && chats[activeChatId] ? chats[activeChatId].messages : [];

  // Create new chat
  const createNewChat = () => {
    const newChat = createChat();
    setChats((prev) => ({ ...prev, [newChat.id]: newChat }));
    setActiveChatId(newChat.id);
    setStreamingContent("");
    setIsStreaming(false);
  };

  // Switch to existing chat
  const switchChat = (id: string) => {
    if (chats[id]) {
      setActiveChatId(id);
      setStreamingContent("");
      setIsStreaming(false);
    }
  };

  // Delete chat
  const deleteChat = (id: string) => {
    deleteStoredChat(id);
    const newChats = { ...chats };
    delete newChats[id];
    setChats(newChats);

    // If deleted chat was active, switch to another
    if (activeChatId === id) {
      const remainingIds = Object.keys(newChats);
      if (remainingIds.length > 0) {
        // Switch to most recently updated chat
        const sortedIds = remainingIds.sort(
          (a, b) => newChats[b].updatedAt - newChats[a].updatedAt
        );
        setActiveChatId(sortedIds[0]);
      } else {
        // No chats left, create new one
        const newChat = createChat();
        setChats({ [newChat.id]: newChat });
        setActiveChatId(newChat.id);
      }
    }
  };

  // Clear current chat
  const clearCurrentChat = () => {
    if (!activeChatId) return;

    clearChatMessages(activeChatId);
    const updatedChat = {
      ...chats[activeChatId],
      messages: [],
      title: "New Chat",
      updatedAt: Date.now(),
    };
    setChats((prev) => ({ ...prev, [activeChatId]: updatedChat }));
    setStreamingContent("");
    setIsStreaming(false);
  };

  // Add message to current chat
  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    if (!activeChatId) return;

    const newMessage: Message = {
      ...message,
      id: generateChatId(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMessage];
    updateChat(activeChatId, updatedMessages);

    const updatedChat = {
      ...chats[activeChatId],
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    // Update title if it's still "New Chat"
    if (
      updatedChat.title === "New Chat" &&
      message.role === "user" &&
      message.content.trim()
    ) {
      const title =
        message.content.length > 50
          ? message.content.substring(0, 50) + "..."
          : message.content;
      updatedChat.title = title;
    }

    setChats((prev) => ({ ...prev, [activeChatId]: updatedChat }));
  };

  // Update streaming message
  const updateStreamingMessage = (content: string) => {
    setStreamingContent(content);
    setIsStreaming(content.length > 0);
  };

  // Finalize streaming message
  const finalizeStreamingMessage = (fullResponse: string) => {
    if (!activeChatId) return;

    const newMessage: Message = {
      id: generateChatId(),
      role: "assistant",
      content: fullResponse,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMessage];
    updateChat(activeChatId, updatedMessages);

    const updatedChat = {
      ...chats[activeChatId],
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setChats((prev) => ({ ...prev, [activeChatId]: updatedChat }));
    setStreamingContent("");
    setIsStreaming(false);
  };

  const contextValue: ExtendedChatContextType = {
    chats,
    activeChatId,
    messages,
    createNewChat,
    switchChat,
    deleteChat,
    clearCurrentChat,
    addMessage,
    updateStreamingMessage,
    isStreaming,
    streamingContent,
    finalizeStreamingMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}
