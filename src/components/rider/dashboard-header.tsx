"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

type DashboardHeaderProps = { firstName: string };

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function DashboardHeader({ firstName }: DashboardHeaderProps) {
    const today = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const handleLogout = async () => {
        try {
            const res = await fetch(`/api/v1/public/auth/logout`, { method: "POST" });
            if (res.status === 200) {
                toast({ title: "Logged out", duration: 2500 });
                window.location.href = "/";
            } else {
                window.location.reload();
            }
        } catch (e) {
            toast({
                title: "Logout error",
                description: "Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="rounded-xl bg-white/15 px-2 py-1 text-xs text-white shadow-sm backdrop-blur">
                    Rider
                </p>
                <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                    Welcome back, {firstName}!
                </h1>
                <p className="mt-1 hidden text-white/80 xs:block">{today}</p>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-12 w-12 rounded-full p-0 ring-1 ring-white/20 hover:bg-white/10"
                        aria-label="Open profile menu"
                    >
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                    firstName || "Rider"
                                )}`}
                                alt={firstName}
                            />
                            <AvatarFallback>{getInitials(firstName || "R")}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-64 max-w-[calc(100vw-1.5rem)]"
                    forceMount
                >
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex min-w-0 flex-col space-y-1">
                            <p className="truncate text-sm font-medium leading-none">
                                {firstName}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">Rider</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/rider/dashboard" className="flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
