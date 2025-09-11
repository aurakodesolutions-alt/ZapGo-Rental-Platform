"use client";

import { useEffect } from "react";

export default function SWRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js", { scope: "/" })
                    .then((reg) => {
                        console.log("Service worker registered:", reg);
                    })
                    .catch((err) => console.error("SW registration failed:", err));
            });
        }
    }, []);

    return null; // nothing to render
}
