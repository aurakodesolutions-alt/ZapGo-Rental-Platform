import { Suspense } from "react";
import { BookWizard } from "@/components/booking/booking-wizard";
import { BookingProvider } from "@/components/booking/booking-provider";
// import { AuthProvider } from "@/components/auth-provider";

export default function BookPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
                <BookingProvider>
                    <BookWizard />
                </BookingProvider>
        </Suspense>
    );
}
