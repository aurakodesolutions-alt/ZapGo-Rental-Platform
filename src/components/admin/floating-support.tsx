"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LifeBuoy, Phone, MessageCircle, Mail } from "lucide-react";

type Props = {
    // Optional overrides (defaults set to your details)
    whatsapp?: string;  // E.164 or plain, e.g. "+916378281761" or "916378281761"
    phone?: string;     // e.g. "+916378281761"
    email?: string;     // e.g. "aurakodesolutions@gmail.com"
    className?: string; // position tweaks if you ever need
};

export default function FloatingSupport({
                                            whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "916378281761",
                                            phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+916378281761",
                                            email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "aurakodesolutions@gmail.com",
                                            className,
                                        }: Props) {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();

    const message = React.useMemo(() => {
        const d = new Date().toLocaleString();
        return encodeURIComponent(
            `Hi AuraKode team, I need help with the admin panel.\n\nPage: ${pathname}\nTime: ${d}\n\nPlease reach out.`
        );
    }, [pathname]);

    const waHref = `https://wa.me/${normalizePhone(whatsapp)}?text=${message}`;
    const telHref = `tel:${phone.replace(/\s+/g, "")}`;
    const mailHref = `mailto:${email}?subject=${encodeURIComponent("ZapGo Admin Support")}&body=${message}`;

    return (
        <TooltipProvider>
            <div
                className={cn(
                    "fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 sm:gap-3 print:hidden",
                    "supports-[padding:max(env(safe-area-inset-bottom))]:mb-[max(env(safe-area-inset-bottom),1.25rem)]",
                    className
                )}
            >
                {/* Actions */}
                <div className={cn("flex flex-col items-end gap-2 transition-all", open ? "opacity-100" : "pointer-events-none opacity-0")}>
                    <ActionChip href={waHref} label="WhatsApp" icon={<MessageCircle className="h-4 w-4" />} className="bg-emerald-500 hover:bg-emerald-600 text-white" />
                    <ActionChip href={telHref} label="Call" icon={<Phone className="h-4 w-4" />} className="bg-primary hover:bg-primary/90 text-primary-foreground" />
                    <ActionChip href={mailHref} label="Email" icon={<Mail className="h-4 w-4" />} className="bg-slate-900 hover:bg-slate-900/90 text-white dark:bg-slate-800" />
                </div>

                {/* Main FAB */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            className={cn(
                                "h-12 w-12 rounded-full shadow-xl transition-transform",
                                "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground hover:scale-105"
                            )}
                            onClick={() => setOpen((v) => !v)}
                            aria-label="Support"
                        >
                            <LifeBuoy className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">Need help? Contact developer</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

/* ---- little helpers ---- */

function ActionChip({
                        href,
                        label,
                        icon,
                        className,
                    }: {
    href: string;
    label: string;
    icon: React.ReactNode;
    className?: string;
}) {
    return (
        <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={cn(
                "group flex items-center gap-2 rounded-full px-3 py-2 shadow-lg transition-all",
                "ring-1 ring-black/5 hover:translate-y-[-2px]",
                className
            )}
            aria-label={label}
            title={label}
        >
            <span className="grid place-items-center">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
        </a>
    );
}

function normalizePhone(p: string) {
    // keep digits only; if it doesn't start with country code, add +91 fallback
    const digits = (p || "").replace(/\D/g, "");
    if (!digits) return "916378281761";
    return digits.startsWith("91") ? digits : `91${digits}`;
}
