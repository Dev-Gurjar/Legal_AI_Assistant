"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scale,
  MessageSquare,
  FileText,
  BarChart3,
  LogOut,
  X,
  Plus,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { clearAuth, getUser } from "@/lib/auth";
import { useChatStore, useUIStore } from "@/lib/store";
import { chatApi } from "@/lib/api";

const navItems = [
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Admin", href: "/dashboard/admin", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [mounted, setMounted] = useState(false);
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { conversations, setConversations, setActiveConversation } =
    useChatStore();

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  useEffect(() => {
    chatApi
      .conversations()
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, [setConversations]);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  function startNewChat() {
    setActiveConversation(null);
    router.push("/dashboard/chat");
    closeSidebar();
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-surface border-r border-border flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            href="/dashboard/chat"
            className="flex items-center gap-2"
            onClick={closeSidebar}
          >
            <Scale className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">RAG Legal Assistant</span>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-fg hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto border-t border-border">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                Conversations
              </span>
              <button
                onClick={startNewChat}
                className="p-1 rounded hover:bg-muted transition"
                title="New chat"
              >
                <Plus className="w-4 h-4 text-muted-fg" />
              </button>
            </div>

            {conversations.length === 0 && (
              <p className="text-xs text-muted-fg py-2">
                No conversations yet
              </p>
            )}

            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv.id);
                    router.push("/dashboard/chat");
                    closeSidebar();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-muted transition group"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-muted-fg shrink-0" />
                  <span className="truncate flex-1">
                    {conv.title || "Untitled"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-fg opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User / Logout */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {mounted ? user?.full_name?.charAt(0)?.toUpperCase() || "U" : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {mounted ? user?.full_name || "User" : "User"}
              </p>
              <p className="text-xs text-muted-fg truncate">
                {mounted ? user?.email || "" : ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-muted transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-muted-fg" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
