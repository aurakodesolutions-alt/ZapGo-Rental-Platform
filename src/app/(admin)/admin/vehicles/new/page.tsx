import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { VehicleForm } from '@/components/admin/forms/vehicle-form';

export default function NewVehiclePage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Add New Vehicle" description="Fill in the details for a new vehicle in your fleet." />
            <Card>
                <CardContent className="pt-6">
                    <VehicleForm />
                </CardContent>
            </Card>
        </div>
    );
}
