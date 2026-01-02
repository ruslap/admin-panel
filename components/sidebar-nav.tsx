"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    MessageSquare,
    Globe,
    BarChart3,
    Settings,
    LogOut,
    HelpCircle,
    Bell,
    Cloud,
    Laptop,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isLocal, setIsLocal] = useState(false);

    useEffect(() => {
        setIsLocal(localStorage.getItem('chtq_api_url') === 'http://localhost:3000');
    }, []);

    const toggleServer = () => {
        const nextLocal = !isLocal;
        if (nextLocal) {
            localStorage.setItem('chtq_api_url', 'http://localhost:3000');
        } else {
            localStorage.removeItem('chtq_api_url');
        }
        window.location.reload();
    };

    const navItems = [
        { icon: MessageSquare, label: "Chats", href: "/chats" },
        { icon: Globe, label: "Sites", href: "/sites" },
        { icon: BarChart3, label: "Analytics", href: "/analytics" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col h-full w-[72px] bg-[rgb(var(--primary-600))] py-5 items-center gap-2 shrink-0 overflow-hidden relative">
                {/* Brand Logo */}
                <div className="mb-6">
                    <div className="w-11 h-11 bg-white/95 rounded-2xl flex items-center justify-center text-[rgb(var(--primary-600))] font-bold text-sm shadow-lg shadow-black/10 transition-smooth hover:scale-105">
                        Chtq
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 flex flex-col gap-1.5 w-full px-2.5">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={`group relative flex items-center justify-center w-full aspect-square rounded-xl transition-smooth ${isActive
                                            ? 'bg-white/20 text-white shadow-sm'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 transition-smooth ${isActive ? '' : 'group-hover:scale-105'}`} />
                                        {isActive && (
                                            <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full -ml-2.5" />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={12}
                                    className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5 shadow-lg"
                                >
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* Footer Navigation */}
                <div className="mt-auto flex flex-col gap-1 w-full px-2.5">
                    {/* Server Toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={toggleServer}
                                className={`flex items-center justify-center w-full aspect-square rounded-xl transition-smooth ${isLocal
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {isLocal ? <Laptop className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                            Server: {isLocal ? "Localhost (3000)" : "Cloud (Render)"}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex items-center justify-center w-full aspect-square rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-smooth">
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                            Help
                        </TooltipContent>
                    </Tooltip>

                    <div className="h-px bg-white/10 mx-1 my-2" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center justify-center w-full aspect-square rounded-xl text-white/40 hover:text-red-300 hover:bg-red-500/20 transition-smooth"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-red-500 border-red-200 text-xs font-medium px-3 py-1.5">
                            Sign Out
                        </TooltipContent>
                    </Tooltip>

                    <div className="mt-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="w-full flex justify-center">
                                    <Avatar className="w-10 h-10 border-2 border-white/20 cursor-pointer hover:border-white/40 transition-smooth">
                                        <AvatarFallback className="bg-white/90 text-[rgb(var(--primary-600))] text-xs font-semibold">
                                            {session?.user?.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                                {session?.user?.name || 'Profile'}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
