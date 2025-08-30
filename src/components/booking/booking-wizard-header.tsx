"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Progress } from '../ui/progress';

interface WizardHeaderProps {
    currentStep: number;
    totalSteps: number;
}

export function WizardHeader({ currentStep, totalSteps }: WizardHeaderProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4">
                <div className="flex h-22 items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <Image src="/images/portal.png" alt="ZapGo Rental Logo" width={110} height={30} />
                    </Link>
                    <div className="text-sm font-medium text-muted-foreground">
                        Step {currentStep} of {totalSteps}
                    </div>
                </div>
            </div>
            <Progress value={progress} className="h-1 rounded-none" />
        </header>
    );
}
