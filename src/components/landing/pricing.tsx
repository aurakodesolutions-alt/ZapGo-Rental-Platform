import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { IndianRupee, Plus, Minus, Shield, Check, Repeat } from "lucide-react"

export function Pricing() {
    const joiningFee = 1000;
    const securityDeposit = 1750;
    const total = joiningFee + securityDeposit;

    return (
        <section id="pricing" className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                        Transparent Pricing, No Surprises
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        One-time fees to get you started. Your security deposit is safe with us.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Your First Payment</CardTitle>
                            <CardDescription>Here's a breakdown of what you'll pay to start riding with ZapGo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Minus className="w-5 h-5 text-destructive" />
                                        <div>
                                            <p className="font-semibold">Joining Fee</p>
                                            <p className="text-xs text-muted-foreground">One-time, non-refundable</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-lg flex items-center"><IndianRupee className="w-4 h-4" />{joiningFee.toLocaleString('en-IN')}</p>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Repeat className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="font-semibold">Security Deposit</p>
                                            <p className="text-xs text-muted-foreground">Fully refundable</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-lg flex items-center"><IndianRupee className="w-4 h-4" />{securityDeposit.toLocaleString('en-IN')}</p>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                                    <p className="font-bold text-xl text-primary">Total Payable Now</p>
                                    <p className="font-extrabold text-2xl text-primary flex items-center"><IndianRupee className="w-5 h-5" />{total.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
