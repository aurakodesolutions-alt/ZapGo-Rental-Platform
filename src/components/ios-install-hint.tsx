"use client";

import { useEffect, useState } from "react";

/** Detect iOS Safari and non-installed state */
function isIosSafari(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return isIOS && isSafari;
}
function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

export default function IosInstallHint() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!isIosSafari() || isStandalone()) return;
        const t = setTimeout(() => setShow(true), 1200); // show after initial load/overlay
        return () => clearTimeout(t);
    }, []);

    if (!show) return null;

    // iOS share icon SVG and instructions
    return (
        <div
            role="dialog"
            aria-label="Install ZapGo on your Home Screen"
            className="fixed left-3 right-3 bottom-3 z-[9998] rounded-2xl bg-black/80 backdrop-blur text-white shadow-lg p-3 sm:p-4 flex items-center gap-3"
        >
            {/* Share glyph */}
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 3l4 4h-3v6h-2V7H8l4-4zM5 13h2v6h10v-6h2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6z"/>
            </svg>
            <div className="text-sm leading-tight">
                <div className="font-medium">Install ZapGo</div>
                <div className="opacity-80">
                    Open <span className="font-semibold">Share</span> then tap <span className="font-semibold">Add to Home Screen</span>.
                </div>
            </div>
            <button
                onClick={() => setShow(false)}
                className="ml-auto inline-flex items-center rounded-xl border border-white/20 px-2 py-1 text-xs opacity-80 hover:opacity-100"
            >
                Got it
            </button>
        </div>
    );
}
