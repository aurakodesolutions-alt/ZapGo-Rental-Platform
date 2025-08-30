import Link from 'next/link';
import { Button } from '../ui/button';

export function MobileCta() {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t z-50">
            <Button asChild size="lg" className="w-full text-lg rounded-xl">
                <Link href="/book">Book Now</Link>
            </Button>
        </div>
    );
}
