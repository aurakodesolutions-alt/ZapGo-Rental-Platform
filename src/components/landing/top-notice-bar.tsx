import { Zap } from 'lucide-react'

export function TopNoticeBar() {
    return (
        <div className="bg-secondary text-secondary-foreground text-center py-2 px-4 text-sm font-medium">
            <div className="container mx-auto flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Now in your city! &bull; Early-bird joining fee just <span className="font-bold">₹1000</span> for a limited time!</span>
            </div>
        </div>
    )
}
