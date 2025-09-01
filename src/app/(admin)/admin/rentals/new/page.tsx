import { PageHeader } from '@/components/admin/page-header';
import { RentalWizard } from '@/components/admin/forms/rental-wizard';

export default function NewRentalPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Create a New Rental" />
            <RentalWizard />
        </div>
    );
}
