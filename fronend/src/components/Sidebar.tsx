import { useChatContext } from "../context/ChatContext";
import { useState } from "react";

export default function Sidebar() {
  const { chats, activeChatId, createNewChat, switchChat, deleteChat } =
    useChatContext();
  const [isOpen, setIsOpen] = useState(true);

  const chatList = Object.values(chats).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat(chatId);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-2 text-purple-400 hover:bg-slate-700/90 transition-all shadow-lg"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-slate-900/95 backdrop-blur-sm border-r border-purple-500/20 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header with New Chat Button */}
        <div className="p-4 border-b border-purple-500/20">
          <button
            onClick={createNewChat}
            className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatList.length === 0 ? (
            <div className="text-center text-slate-500 mt-8 px-4">
              <p className="text-sm">No chats yet.</p>
              <p className="text-xs mt-1">Click "New Chat" to start!</p>
            </div>
          ) : (
            chatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={`group relative px-4 py-3 rounded-lg cursor-pointer transition-all ${
                  activeChatId === chat.id
                    ? "bg-linear-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 shadow-lg"
                    : "bg-slate-800/40 hover:bg-slate-800/60 border border-transparent hover:border-purple-500/20"
                }`}
              >
                {/* Chat Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-medium truncate ${
                        activeChatId === chat.id
                          ? "text-purple-300"
                          : "text-slate-300"
                      }`}
                    >
                      {chat.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {chat.messages.length} messages
                      </span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                    aria-label="Delete chat"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Active Indicator */}
                {activeChatId === chat.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-r" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-purple-500/20">
          <div className="text-xs text-slate-500 text-center">
            {chatList.length} {chatList.length === 1 ? "chat" : "chats"} saved
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}
