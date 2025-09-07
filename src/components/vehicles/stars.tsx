export default function Stars({ value = 0 }: { value?: number }) {
    const v = Math.max(0, Math.min(5, value));
    return (
        <div className="flex items-center gap-0.5 text-yellow-400">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i < Math.round(v) ? "fill-current" : "fill-transparent stroke-current"}`}>
                    <path d="M10 1.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9L4.6 18l1-6L1.4 8l6-.9L10 1.5z"/>
                </svg>
            ))}
        </div>
    );
}
