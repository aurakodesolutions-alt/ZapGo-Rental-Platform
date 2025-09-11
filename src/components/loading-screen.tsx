// src/components/loading-screen.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Behavior:
 * - Shows immediately on first paint (SSR renders it).
 * - Waits for `window.load` (all assets done), then fades out.
 * - Uses a mounted+loading state to avoid hydration flicker and to control exit.
 */
export default function LoadingScreen() {
    const [mounted, setMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [hiding, setHiding] = useState(false);
    const [gone, setGone] = useState(false);
    const minShowMs = 400; // optional: prevent flash on fast connections
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        setMounted(true);

        const finish = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const wait = Math.max(0, minShowMs - elapsed);
            setTimeout(() => {
                setLoaded(true);
                setHiding(true);
                // remove from DOM after fade animation
                const t = setTimeout(() => setGone(true), 350);
                return () => clearTimeout(t);
            }, wait);
        };

        if (document.readyState === "complete") {
            finish();
        } else {
            window.addEventListener("load", finish, { once: true });
            return () => window.removeEventListener("load", finish);
        }
    }, []);

    if (gone) return null;

    // Colors derived from your uploaded video palette
    const BG = "rgba(0,0,0,0.92)";     // #000000, slightly transparent
    const RIM = "#2C4450";             // deep blue-gray
    const ACCENT = "#5FB62D";          // brand green
    const ACCENT2 = "#9CB9AB";         // desaturated green

    return (
        <div
            aria-hidden="true"
            className={[
                "fixed inset-0 z-[9999] flex items-center justify-center",
                "transition-opacity duration-300 ease-out",
                hiding ? "opacity-0 pointer-events-none" : "opacity-100"
            ].join(" ")}
            style={{
                background: `radial-gradient(60% 60% at 50% 40%, rgba(44,68,80,0.35) 0%, rgba(0,0,0,0.0) 55%), ${BG}`
            }}
        >
            {/* Brand mark + ring loader */}
            <div
                className={[
                    "flex flex-col items-center gap-5",
                    "transition-transform duration-300 ease-out",
                    hiding ? "scale-95" : "scale-100"
                ].join(" ")}
            >
                {/* Circular SVG loader with two strokes and a rotating arc */}
                <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="Loading">
                    <defs>
                        <linearGradient id="zg-grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={ACCENT} />
                            <stop offset="100%" stopColor={ACCENT2} />
                        </linearGradient>
                        <filter id="zg-blur" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="0.6" />
                        </filter>
                    </defs>

                    {/* Base ring */}
                    <circle cx="56" cy="56" r="44" stroke={RIM} strokeWidth="8" fill="none" opacity="0.35" />

                    {/* Rotating arc */}
                    <g>
                        <circle
                            cx="56"
                            cy="56"
                            r="44"
                            stroke="url(#zg-grad)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray="62 276" /* arc length + rest */
                        >
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 56 56"
                                to="360 56 56"
                                dur="1.1s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </g>

                    {/* subtle glow */}
                    <circle cx="56" cy="56" r="44" stroke={ACCENT} strokeWidth="2" fill="none" opacity="0.25" filter="url(#zg-blur)" />

                    {/* Center glyph: simple bolt shape (fallback if no logo) */}
                    <g transform="translate(44,32)">
                        <path
                            d="M15 0L0 28h12l-3 20 18-28H14l1-20z"
                            fill="url(#zg-grad)"
                            opacity="0.95"
                        />
                    </g>
                </svg>

                {/* Wordmark */}
                <div className="text-center">
          <span
              className="block text-2xl font-semibold tracking-wide"
              style={{
                  background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
                  WebkitBackgroundClip: "text",
                  color: "transparent"
              }}
          >
            ZapGo
          </span>
                    <span className="block text-sm text-white/70">
            charging up your ride…
          </span>
                </div>
            </div>
        </div>
    );
}
