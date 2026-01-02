import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar />
      <main className="flex-1 relative">
        <ChatInterface />
      </main>
    </div>
  );
}
