'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const WA_GREEN = '#25D366';

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M19.11 17.15c-.28-.14-1.64-.81-1.9-.9-.26-.1-.45-.14-.64.14-.2.28-.74.9-.91 1.08-.17.2-.34.2-.62.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.37-1.63-1.53-1.9-.16-.28-.02-.43.12-.57.13-.14.28-.34.43-.5.14-.17.2-.28.3-.48.1-.2.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.13-.23-.55-.47-.48-.64-.48l-.54-.01c-.2 0-.5.07-.76.35-.26.28-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.02.15.2 2.03 3.1 4.94 4.31.69.3 1.22.48 1.63.61.68.22 1.3.19 1.8.12.55-.08 1.64-.67 1.87-1.31.23-.64.23-1.2.16-1.31-.07-.12-.25-.2-.53-.34Z"
            />
            <path
                fill="currentColor"
                d="M26.67 5.33A12.63 12.63 0 0 0 16 1.34C8.82 1.34 2.98 7.18 2.98 14.36c0 2.33.61 4.6 1.78 6.6L3 30.66l9.9-1.3c1.94 1.06 4.13 1.61 6.36 1.61 7.18 0 13.02-5.84 13.02-13.02 0-3.48-1.35-6.76-3.61-9.02Zm-10.67 22c-1.95 0-3.85-.52-5.5-1.5l-.4-.24-5.86.77.79-5.72-.26-.41a11.34 11.34 0 0 1-1.74-6.07c0-6.26 5.1-11.36 11.37-11.36 3.04 0 5.9 1.18 8.05 3.33a11.3 11.3 0 0 1 3.33 8.04c0 6.27-5.1 11.36-11.38 11.36Z"
            />
        </svg>
    );
}

type FloatingCtaProps = {
    phone?: string;     // tel:+91...
    whatsapp?: string;  // digits only for wa.me
    variant?: 'glass' | 'solid' | 'green'; // green = classic WA green chip w/ white ring
    className?: string;
};

export function FloatingCta({
                                phone = '+916374580290',
                                whatsapp = '916374580290',
                                variant = 'glass',
                                className,
                            }: FloatingCtaProps) {
    const baseWrap =
        'fixed z-[60] print:hidden right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2';

    const chipBase =
        'h-12 w-12 rounded-full shadow-lg shadow-black/20 ring-1 ring-border transition-transform hover:scale-105 active:scale-95';

    const chipGlass =
        'bg-background/90 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60';
    const chipSolid = 'bg-card text-foreground';
    const chipGreen =
        'bg-[#25D366] text-white ring-2 ring-white/80 shadow-black/40';

    const waChip =
        variant === 'green'
            ? cn(chipBase, chipGreen)
            : cn(chipBase, variant === 'solid' ? chipSolid : chipGlass, 'text-[color:var(--wa-green)]');

    const callChip = cn(chipBase, variant === 'solid' ? chipSolid : chipGlass, 'text-primary');

    return (
        <TooltipProvider delayDuration={250}>
            <div className={cn(baseWrap, className)} role="region" aria-label="Quick contact">
                {/* WhatsApp */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            asChild
                            size="icon"
                            className={waChip}
                            style={variant === 'green' ? undefined : ({ ['--wa-green' as any]: WA_GREEN } as any)}
                        >
                            <Link
                                href={`https://wa.me/${whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Chat on WhatsApp"
                                prefetch={false}
                            >
                                <WhatsAppIcon className="h-6 w-6" />
                                <span className="sr-only">WhatsApp</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10}>
                        Chat on WhatsApp
                    </TooltipContent>
                </Tooltip>

                {/* Call */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild size="icon" className={callChip}>
                            <a href={`tel:${phone}`} aria-label="Call us">
                                <Phone className="h-5 w-5" />
                                <span className="sr-only">Call</span>
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10}>
                        Call us
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

export default FloatingCta;
