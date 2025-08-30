"use client"

import { useBookingWizard } from "./booking-provider";
import { Plan } from "@/lib/types";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Check, ShieldAlert, BadgeIndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

const plansData = {
    Lite: {
        title: "ZapGo Lite",
        description: "Low mileage, non-registered vehicle.",
        docs: ["Aadhaar Card", "PAN Card"]
    },
    Pro: {
        title: "ZapGo Pro",
        description: "High mileage, registered vehicle.",
        docs: ["Aadhaar Card", "PAN Card", "Driving License"]
    }
};

interface Step3PlanProps {
    onNext: () => void;
}


export function Step3_Plan({ onNext }: Step3PlanProps) {
    const { draft, setDraft } = useBookingWizard();
    const fees = { joiningFee: 1000, deposit: 1750, total: 2750 };

    const handleSelectPlan = (plan: Plan) => {
        setDraft({ plan });
        onNext();
    };

    const compatiblePlans = draft.vehicle?.compatiblePlans || ['Lite', 'Pro'];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Choose Your Plan</h1>
                <p className="text-muted-foreground">This scooter is compatible with the following plans.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {(plansData as any)[compatiblePlans[0] ? 'Lite' : 'Pro'] &&
                    <PlanCard plan="Lite" selectedPlan={draft.plan} onSelect={handleSelectPlan} disabled={!compatiblePlans.includes('Lite')} />
                }
                {(plansData as any)[compatiblePlans[1] ? 'Pro' : 'Lite'] &&
                    <PlanCard plan="Pro" selectedPlan={draft.plan} onSelect={handleSelectPlan} disabled={!compatiblePlans.includes('Pro')} />
                }
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Fee Summary</h3>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary"><BadgeIndianRupee />One-Time Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span>Joining Fee (Non-Refundable)</span>
                            <span className="font-medium">₹{fees.joiningFee.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Security Deposit (Refundable)</span>
                            <span className="font-medium">₹{fees.deposit.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                            <span>Total Payable</span>
                            <span>₹{fees.total.toLocaleString('en-IN')}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PlanCard({ plan, selectedPlan, onSelect, disabled }: { plan: Plan, selectedPlan?: Plan, onSelect: (plan: Plan) => void, disabled?: boolean }) {
    return (
        <Card
            onClick={() => !disabled && onSelect(plan)}
            className={cn(
                "cursor-pointer transition-all",
                selectedPlan === plan ? "ring-2 ring-primary" : "hover:shadow-md",
                disabled && "bg-muted/50 cursor-not-allowed opacity-60"
            )}
        >
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {plansData[plan].title}
                    {selectedPlan === plan && <Check className="h-6 w-6 text-primary" />}
                </CardTitle>
                <CardDescription>{plansData[plan].description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm font-semibold mb-2">Documents Required:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                    {plansData[plan].docs.map(doc => <li key={doc}>{doc}</li>)}
                </ul>
                {plan === 'Pro' && <Badge variant="destructive" className="mt-4 gap-1"><ShieldAlert className="h-3 w-3" />Driving License Required</Badge>}
            </CardContent>
        </Card>
    )
}
