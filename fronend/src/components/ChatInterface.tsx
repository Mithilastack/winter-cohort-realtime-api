import { useState, useEffect, useRef, type FormEvent } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatContext } from "../context/ChatContext";

export default function ChatInterface() {
  const { socket, isConnected } = useSocket();
  const {
    messages,
    addMessage,
    updateStreamingMessage,
    clearCurrentChat,
    isStreaming,
    streamingContent,
  } = useChatContext();

  // Access the extended context to get finalizeStreamingMessage
  const chatContext = useChatContext() as any;
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    if (!socket) return;

    // Listen for streaming chunks
    socket.on("chat-stream", (data: { content: string }) => {
      updateStreamingMessage(streamingContent + data.content);
    });

    // Listen for completion
    socket.on("chat-complete", (data: { fullResponse: string }) => {
      // Use finalizeStreamingMessage to properly save the complete message
      if (chatContext.finalizeStreamingMessage) {
        chatContext.finalizeStreamingMessage(data.fullResponse);
      } else {
        addMessage({
          role: "assistant",
          content: data.fullResponse,
        });
      }
      updateStreamingMessage(""); // Clear streaming content
    });

    // Listen for errors
    socket.on("chat-error", (data: { error: string }) => {
      console.error("Chat error:", data.error);
      addMessage({
        role: "assistant",
        content: `Error: ${data.error}`,
      });
      updateStreamingMessage(""); // Clear streaming content
    });

    return () => {
      socket.off("chat-stream");
      socket.off("chat-complete");
      socket.off("chat-error");
    };
  }, [
    socket,
    streamingContent,
    addMessage,
    updateStreamingMessage,
    chatContext,
  ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !isConnected || isStreaming) return;

    // Add user message via context
    addMessage({
      role: "user",
      content: input.trim(),
    });

    // Emit to backend
    socket.emit("chat-message", { prompt: input.trim() });

    // Reset input
    setInput("");
    updateStreamingMessage(""); // Prepare for new streaming
  };

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/20 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <div className="flex items-center gap-4">
            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={clearCurrentChat}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
              >
                Clear Chat
              </button>
            )}
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              <span className="text-sm text-slate-300">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center text-slate-400 mt-20">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">
                Start a conversation
              </h2>
              <p className="text-sm">
                Ask me anything, and I'll respond in real-time!
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${
                  message.role === "user"
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-slate-800/80 backdrop-blur-sm text-slate-100 border border-purple-500/20"
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {message.role === "user" ? "You" : "AI"}
                </div>
                <div className="whitespace-pre-wrap wrap-break-word">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-6 py-4 shadow-lg bg-slate-800/80 backdrop-blur-sm text-slate-100 border border-purple-500/20">
                <div className="text-xs font-semibold mb-1 opacity-70">AI</div>
                <div className="whitespace-pre-wrap wrap-break-word">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-t border-purple-500/20 p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isConnected
                  ? "Type your message..."
                  : "Waiting for connection..."
              }
              disabled={!isConnected || isStreaming}
              className="flex-1 bg-slate-900/50 border border-purple-500/30 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={!isConnected || isStreaming || !input.trim()}
              className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
            >
              {isStreaming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Thinking...</span>
                </div>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
