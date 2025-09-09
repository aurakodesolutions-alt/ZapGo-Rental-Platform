"use client"

import * as React from "react"
import {ThemeProvider as NextThemesProvider} from "next-themes"

export function ThemeProvider({children, ...props}: { children: React.ReactNode }) {
    return <NextThemesProvider defaultTheme={"light"} attribute={"class"} enableSystem
                               disableTransitionOnChange>{children}</NextThemesProvider>
}
