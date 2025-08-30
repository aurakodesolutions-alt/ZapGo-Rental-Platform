"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download, LayoutGrid, Sparkles } from 'lucide-react'
// import { usePwaInstall } from '@/hooks/use-pwa-install'
// import { useSession } from 'next-auth/react'
// import { useAccountDrawer } from '../account/account-drawer-provider'

export function MobileBottomBar() {
    // const { canInstall, promptInstall } = usePwaInstall()
    // const { data: session } = useSession();
    // const { openDrawer } = useAccountDrawer();

    const primaryAction = (
        <Button asChild className="flex-1">
            <Link href="/book"><Sparkles className="mr-2 h-4 w-4" />Book Now</Link>
        </Button>
    );

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t p-2">
            <div className="container mx-auto px-4 flex items-center justify-between gap-2">
                {primaryAction}
            </div>
        </div>
    )
}
