import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-muted-foreground">{description}</p>
                )}
            </div>
            {children && <div className="flex shrink-0 gap-2">{children}</div>}
        </div>
    );
}
