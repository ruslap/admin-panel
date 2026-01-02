"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Paperclip, Smile, Send, Trash2, Eraser } from "lucide-react";

interface Message {
    id: string;
    chatId: string;
    text: string;
    from: 'admin' | 'visitor';
    createdAt: string;
}

interface ChatViewProps {
    chat: {
        id: string;
        visitor: string;
        visitorId: string;
    };
    socket: any;
    siteId: string;
    onDeleteChat?: (id: string) => void;
    onClearMessages?: (id: string) => void;
}

export function ChatView({ chat, socket, siteId, onDeleteChat, onClearMessages }: ChatViewProps) {
    const chatId = chat?.id;
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Configurable API URL for flexibility between local/prod
    const apiUrl = (typeof window !== 'undefined' && localStorage.getItem('chtq_api_url'))
        || "https://api-server-chatiq.onrender.com";

    // Fetch message history
    useEffect(() => {
        if (chatId) {
            fetch(`${apiUrl}/chats/${chatId}/history`, {
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setMessages(data);
                    } else {
                        console.error("Messages fetch did not return an array:", data);
                        setMessages([]);
                    }
                })
                .catch(err => {
                    console.error("History fetch error:", err);
                    setMessages([]);
                });
        }
    }, [chatId, session, apiUrl]);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingMessage = (msg: Message) => {
            if (msg.chatId === chatId) {
                setMessages(prev => {
                    const currentMessages = Array.isArray(prev) ? prev : [];
                    if (currentMessages.find(m => m.id === msg.id)) return currentMessages;
                    return [...currentMessages, msg];
                });
            }
        };

        socket.on("chat:message", handleIncomingMessage);
        socket.on("admin:message", handleIncomingMessage);
        socket.on("chat:new_message", handleIncomingMessage);

        return () => {
            socket.off("chat:message", handleIncomingMessage);
            socket.off("admin:message", handleIncomingMessage);
            socket.off("chat:new_message", handleIncomingMessage);
        };
    }, [chatId, socket]);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;

        socket.emit("admin:message", {
            chatId,
            text: input,
            siteId: siteId // Use the actual siteId
        });

        setInput("");
    };

    const handleClear = async () => {
        // Temporarily removed confirm dialog for testing
        try {
            const res = await fetch(`${apiUrl}/chats/${chatId}/clear`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                }
            });
            if (res.ok) {
                setMessages([]);
                onClearMessages?.(chatId);
            } else if (res.status === 404) {
                alert("Error 404: The backend server does not have this feature yet. If you are using Render, please deploy your latest changes. If testing locally, ensure you have set localStorage.setItem('chtq_api_url', 'http://localhost:3000').");
            } else {
                alert(`Failed to clear chat: ${res.statusText}`);
            }
        } catch (err) {
            console.error("Failed to clear chat:", err);
            alert("Network error. Please check if the API server is reachable.");
        }
    };

    const handleDelete = async () => {
        // Temporarily removed confirm dialog for testing
        try {
            const res = await fetch(`${apiUrl}/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                }
            });
            if (res.ok) {
                onDeleteChat?.(chatId);
            } else if (res.status === 404) {
                alert("Error 404: The backend server does not have this feature yet. If you are using Render, please deploy your latest changes. If testing locally, ensure you have set localStorage.setItem('chtq_api_url', 'http://localhost:3000').");
            } else {
                alert(`Failed to delete chat: ${res.statusText}`);
            }
        } catch (err) {
            console.error("Failed to delete chat:", err);
            alert("Network error. Please check if the API server is reachable.");
        }
    };

    const safeMessages = Array.isArray(messages) ? messages : [];

    return (
        <div className="flex flex-col h-full bg-[rgb(var(--surface-muted))] selection:bg-[rgb(var(--primary))]/20">
            {/* Header */}
            <div className="h-16 px-6 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))] flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="w-10 h-10 border-0 ring-2 ring-[rgb(var(--border))]">
                            <AvatarFallback className="bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] font-medium text-sm">
                                {chat.visitor?.[0] || 'V'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute ring-2 ring-[rgb(var(--surface))] -bottom-0.5 -right-0.5 w-3 h-3 bg-[rgb(var(--success))] rounded-full"></div>
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-[rgb(var(--foreground))] leading-none">{chat.visitor}</div>
                        <div className="text-[10px] text-[rgb(var(--success))] font-medium uppercase tracking-wider mt-1">Active Now</div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        title="Clear History"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] hover:text-amber-500"
                    >
                        <Eraser className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        title="Delete Conversation"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="w-[1px] h-4 bg-[rgb(var(--border))] mx-1"></div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
                <div className="flex flex-col gap-4 max-w-2xl mx-auto min-h-full">
                    {safeMessages.map((msg, idx) => {
                        const isPrevFromSame = idx > 0 && safeMessages[idx - 1].from === msg.from;
                        const isAdmin = msg.from === 'admin';

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} ${isPrevFromSame ? '-mt-2' : ''} animate-fade-in`}
                            >
                                {!isPrevFromSame && (
                                    <div className="text-[10px] font-medium text-[rgb(var(--foreground-secondary))] mb-1.5 px-1 uppercase tracking-wider">
                                        {isAdmin ? 'You' : 'Visitor'}
                                    </div>
                                )}
                                <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] transition-smooth ${isAdmin
                                    ? 'bg-[rgb(var(--primary))] text-white rounded-br-md'
                                    : 'bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] rounded-bl-md border border-[rgb(var(--border))]'
                                    }`}>
                                    {msg.text}
                                    <div className={`text-[10px] mt-1.5 tabular-nums ${isAdmin ? 'text-white/60 text-right' : 'text-[rgb(var(--foreground-secondary))] text-left'
                                        }`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {safeMessages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in">
                            <div className="w-16 h-16 bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] flex items-center justify-center mb-4 animate-float">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgb(var(--foreground-secondary))]">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">Waiting for messages...</p>
                            <p className="text-xs text-[rgb(var(--foreground-secondary))]/70 mt-1">The visitor hasn't sent anything yet</p>
                        </div>
                    )}
                    <div className="h-4 w-full" />
                </div>
            </ScrollArea>

            {/* Composer */}
            <div className="px-6 pb-6 pt-2 shrink-0">
                <div className="max-w-2xl mx-auto">
                    <div className="relative bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] shadow-sm focus-within:border-[rgb(var(--primary))]/30 focus-within:ring-4 focus-within:ring-[rgb(var(--primary))]/5 transition-smooth">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full min-h-[52px] max-h-40 p-4 pb-14 bg-transparent border-none focus-visible:ring-0 resize-none text-sm leading-relaxed placeholder:text-[rgb(var(--foreground-secondary))]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />

                        {/* Bottom Actions */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="flex gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                                >
                                    <Smile className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-[rgb(var(--foreground-secondary))] hidden sm:block">
                                    Press <kbd className="px-1.5 py-0.5 bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))] rounded text-[10px] font-medium mx-0.5">Enter</kbd> to send
                                </span>
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))] h-9 px-4 rounded-xl shrink-0 flex items-center gap-2 font-medium text-xs transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span>Send</span>
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
