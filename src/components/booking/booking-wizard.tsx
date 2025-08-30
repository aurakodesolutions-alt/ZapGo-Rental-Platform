"use client"

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { parse, format, isValid, addDays } from 'date-fns';
import { useBookingWizard } from './booking-provider';
import { WizardHeader } from './booking-wizard-header';
import { Step1_Dates } from './step-1-dates';
import { Step2_Vehicle } from './step-2-vehicle';
import { Step3_Plan } from './step-3-plans';
import { Step4_Rider } from './step-4-rider';
import { Step5_Payment } from './step-5-payment';
import { WizardFooter } from './booking-wizard-footer';
import { BookingSuccess } from './booking-success';

const steps = [
    { id: 1, component: Step1_Dates },
    { id: 2, component: Step2_Vehicle },
    { id: 3, component: Step3_Plan },
    { id: 4, component: Step4_Rider },
    { id: 5, component: Step5_Payment },
];

export function BookWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { draft, setDraft } = useBookingWizard();
    const [currentStep, setCurrentStep] = useState(1);

    // Prefill from URL query params on initial load
    useEffect(() => {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        const cityParam = searchParams.get('city');
        const vehicleParam = searchParams.get('vehicle');
        const planParam = searchParams.get('plan');

        const initialDraft: any = {};

        if (fromParam && toParam) {
            const fromDate = parse(fromParam, 'yyyy-MM-dd', new Date());
            const toDate = parse(toParam, 'yyyy-MM-dd', new Date());
            if (isValid(fromDate) && isValid(toDate)) {
                initialDraft.dates = { from: fromDate, to: toDate };
            }
        }
        if (cityParam) initialDraft.city = cityParam;
        if (vehicleParam) initialDraft.vehicle = { id: vehicleParam }; // Will be populated later
        if (planParam) initialDraft.plan = planParam.charAt(0).toUpperCase() + planParam.slice(1);

        if (Object.keys(initialDraft).length > 0) {
            setDraft(initialDraft);
        }
    }, []); // Run only once

    const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length + 1));
    const goToPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    if (draft.bookingId && draft.bookingCode) {
        return <BookingSuccess />;
    }

    const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component;

    return (
        <div className="flex flex-col min-h-dvh! bg-muted/30">
            <WizardHeader currentStep={currentStep} totalSteps={steps.length} />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {CurrentStepComponent && <CurrentStepComponent onNext={goToNextStep} />}
                </div>
            </main>

            <WizardFooter
                currentStep={currentStep}
                onNext={goToNextStep}
                onBack={goToPrevStep}
            />
        </div>
    );
}
