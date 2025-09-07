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

type DashboardHeaderProps = {
    firstName: string;
};

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
                toast({ title: "Logged out", variant: "default", duration: 3000 });
                window.location.href = "/";
            } else {
                window.location.reload();
            }
        } catch (e: any) {
            console.error(e);
            toast({
                title: "Logout Error",
                variant: "destructive",
                description: "Please try again.",
            });
        }
    };

    return (
        <div className="flex w-full flex-row items-center justify-between gap-3">
            {/* Left: Greeting */}
            <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold truncate max-w-[75vw]">
                    Welcome back, {firstName}!
                </h1>
                {/* Hide date on very narrow screens to save space */}
                <p className="text-muted-foreground mt-0.5 hidden xs:block">
                    {today}
                </p>
            </div>

            {/* Right: Avatar / Menu */}
            <div className="shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {/* Larger touch-target on mobile, smaller on sm+ */}
                        <Button
                            variant="ghost"
                            className="relative h-12 w-12 rounded-full p-0 sm:h-10 sm:w-10"
                            aria-label="Open profile menu"
                        >
                            <Avatar className="h-12 w-12 sm:h-10 sm:w-10 ring-1 ring-border">
                                <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                        firstName || "Rider",
                                    )}`}
                                    alt={firstName}
                                />
                                <AvatarFallback>{getInitials(firstName || "R")}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>

                    {/* Make menu fit on mobile screens */}
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
                                <p className="text-xs leading-none text-muted-foreground">
                                    Rider
                                </p>
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
        </div>
    );
}
