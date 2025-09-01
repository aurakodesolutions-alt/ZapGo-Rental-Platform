import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { PlanForm } from '@/components/admin/forms/plan-form';

export default function NewPlanPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Add New Plan"
                description="Define plan name, required documents, and features."
            />
            <Card>
                <CardContent className="pt-6">
                    <PlanForm />
                </CardContent>
            </Card>
        </div>
    );
}
