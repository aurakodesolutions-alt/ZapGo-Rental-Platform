"use client";

import { Button } from "../ui/button";
import { useBookingWizard } from "./booking-provider";
import { isAfter } from "date-fns";

interface WizardFooterProps {
    currentStep: number;
    onNext: () => void;
    onBack: () => void;
}

export function WizardFooter({ currentStep, onNext, onBack }: WizardFooterProps) {
    const { draft } = useBookingWizard();

    const isNextDisabled = () => {
        switch (currentStep) {
            case 1:
                return (
                    !draft.dates?.from ||
                    !draft.dates?.to ||
                    !draft.city ||
                    !isAfter(draft.dates.to, draft.dates.from)
                );
            case 2:
                return !draft.vehicle;
            case 3:
                return !draft.planName;
            case 4:
                return !draft.contact?.fullName || !draft.kyc?.aadhaar || !draft.termsAccepted;
            default:
                return true; // step 5 manages itself
        }
    };

    if (currentStep >= 5) return null;

    return (
        <footer className="sticky bottom-0 z-40 bg-background/80 backdrop-blur-sm border-t p-4">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    {currentStep > 1 ? (
                        <Button variant="outline" onClick={onBack}>
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}
                    <Button onClick={onNext} disabled={isNextDisabled()}>
                        {currentStep === 4 ? "Review & Confirm" : "Next"}
                    </Button>
                </div>
            </div>
        </footer>
    );
}
