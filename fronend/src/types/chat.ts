export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatContextType {
  chats: { [id: string]: Chat };
  activeChatId: string | null;
  messages: Message[];
  createNewChat: () => void;
  switchChat: (id: string) => void;
  deleteChat: (id: string) => void;
  clearCurrentChat: () => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateStreamingMessage: (content: string) => void;
  isStreaming: boolean;
  streamingContent: string;
}
