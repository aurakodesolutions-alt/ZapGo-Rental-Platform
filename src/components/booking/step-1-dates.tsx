"use client"

import { useEffect, useMemo } from 'react';
import { useBookingWizard } from './booking-provider';
import { DateRangePicker } from '../ui/date-range-picker';
import { Label } from '../ui/label';
import { addDays, isBefore, differenceInDays, isWithinInterval, isSameDay, format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { IndianRupee, MapPin, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

interface Step1DatesProps {
    onNext: () => void;
}

type DraftShape = {
    city?: string;
    /** Current in-progress range selection (kept from your original logic) */
    dates?: DateRange | undefined;
    /** NEW: committed ranges user has added */
    ranges?: DateRange[];
};

const MAX_DAYS = 90;

/** Inclusive day count for a range (e.g., 1 day if same start/end) */
function rangeDays(r: DateRange): number {
    if (!r.from || !r.to) return 0;
    // differenceInDays is exclusive of the start date; +1 to be inclusive
    return differenceInDays(r.to, r.from) + 1;
}

/** Calculate total days across multiple ranges (inclusive days) */
function totalDays(ranges: DateRange[]): number {
    return ranges.reduce((sum, r) => sum + rangeDays(r), 0);
}

/** True if two ranges overlap by at least one day */
function rangesOverlap(a: DateRange, b: DateRange): boolean {
    if (!a.from || !a.to || !b.from || !b.to) return false;
    const start = a.from < b.from ? b.from : a.from;
    const end = a.to > b.to ? b.to : a.to;
    // If start <= end, intervals intersect
    return start <= end;
}

/** Merge-able setDraft helper to avoid wiping other draft fields */
function mergeDraft(setDraft: (d: Partial<DraftShape>) => void, patch: Partial<DraftShape>) {
    setDraft(patch);
}

export function Step1_Dates({ onNext }: Step1DatesProps) {
    const { draft, setDraft } = useBookingWizard() as { draft: DraftShape, setDraft: (d: Partial<DraftShape>) => void };
    const city = 'Siliguri';

    // Ensure city is set once (preserves your original behavior)
    useEffect(() => {
        if (draft.city !== city) {
            mergeDraft(setDraft, { city });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.city]);

    const committedRanges = draft.ranges ?? [];

    /** Hard validation for the currently picked range before adding */
    const currentRangeValidation = useMemo(() => {
        const r = draft.dates;
        if (!r?.from || !r.to) {
            return { ok: false, reason: 'Pick a start and end date to add the range.' };
        }

        // 1) Per-range 90 day cap (inclusive)
        const days = rangeDays(r);
        if (days > MAX_DAYS) {
            return { ok: false, reason: `Each range must be at most ${MAX_DAYS} days.` };
        }

        // 2) No overlap with existing ranges
        for (const existing of committedRanges) {
            if (existing.from && existing.to && rangesOverlap(existing, r)) {
                return { ok: false, reason: 'Ranges cannot overlap existing selections.' };
            }
        }

        // 3) Total 90 day cap across all added ranges
        const projectedTotal = totalDays(committedRanges) + days;
        if (projectedTotal > MAX_DAYS) {
            return { ok: false, reason: `Total selected days cannot exceed ${MAX_DAYS}. You have ${totalDays(committedRanges)} days selected.` };
        }

        return { ok: true as const, reason: '' };
    }, [draft.dates, committedRanges]);

    /** Accept the currently selected range and commit it to the list */
    const addCurrentRange = () => {
        const r = draft.dates;
        if (!r?.from || !r.to) return;

        if (!currentRangeValidation.ok) {
            // If user made a wrong selection, we clear it to "deselect"
            mergeDraft(setDraft, { dates: undefined });
            return;
        }

        const nextRanges = [...committedRanges, { from: r.from, to: r.to }];
        mergeDraft(setDraft, { ranges: nextRanges, dates: undefined });
    };

    /** Remove a committed range by index (deselect) */
    const removeRangeAt = (idx: number) => {
        const next = committedRanges.filter((_, i) => i !== idx);
        mergeDraft(setDraft, { ranges: next });
    };

    /** Clear the in-progress selection (quick deselect when chosen wrong) */
    const clearCurrentSelection = () => {
        mergeDraft(setDraft, { dates: undefined });
    };

    /** Enforce past-date disable (kept from your logic) */
    const disablePastDates = (date: Date) => isBefore(date, addDays(new Date(), -1));

    /** Soft guard: while user is dragging a too-long range, we still allow picking, but we’ll block "Add range" */
    const handleDateChange = (range: DateRange | undefined) => {
        // Always set the working selection so users can refine; we enforce on commit
        mergeDraft(setDraft, { dates: range });
    };

    // Optional: quick helper to show a condensed label for a range chip
    const formatRange = (r: DateRange) => {
        if (!r.from || !r.to) return 'Incomplete range';
        return `${format(r.from, 'MMM d, yyyy')} → ${format(r.to, 'MMM d, yyyy')} (${rangeDays(r)}d)`;
    };

    const totalSelectedDays = totalDays(committedRanges);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">When are you riding?</h1>
                <p className="text-muted-foreground">Select your rental dates to get started.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label>Selected city</Label>
                    <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {city}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Select your rental period(s)</Label>

                    {/* Working range picker (in-progress selection) */}
                    <DateRangePicker
                        date={draft.dates}
                        onDateChange={handleDateChange}
                        disabledDates={disablePastDates}
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={addCurrentRange}
                            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-50"
                            disabled={!draft.dates?.from || !draft.dates?.to || !currentRangeValidation.ok}
                            title={
                                currentRangeValidation.ok
                                    ? 'Add this range'
                                    : currentRangeValidation.reason || 'Select a valid range'
                            }
                        >
                            Add range
                        </button>

                        <button
                            type="button"
                            onClick={clearCurrentSelection}
                            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-50"
                            disabled={!draft.dates?.from && !draft.dates?.to}
                            title="Clear current selection"
                        >
                            Clear selection
                        </button>

                        <span className="ml-auto text-xs text-muted-foreground">
              Total selected: <strong>{totalSelectedDays}</strong> / {MAX_DAYS} days
            </span>
                    </div>

                    {/* Guidance + strict rule */}
                    <p className="text-xs text-muted-foreground">
                        You can add multiple non-overlapping ranges. Each range must be ≤ {MAX_DAYS} days, and your total across all ranges must not exceed {MAX_DAYS} days.
                    </p>

                    {/* Committed ranges list with remove (deselect) */}
                    {committedRanges.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                            <Label className="text-xs text-muted-foreground">Selected ranges</Label>
                            <div className="flex flex-wrap gap-2">
                                {committedRanges.map((r, idx) => (
                                    <span
                                        key={`${r.from?.toISOString() ?? 'x'}-${r.to?.toISOString() ?? 'y'}-${idx}`}
                                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                                    >
                    {formatRange(r)}
                                        <button
                                            type="button"
                                            className="rounded-full p-1 hover:bg-accent"
                                            onClick={() => removeRangeAt(idx)}
                                            aria-label="Remove range"
                                            title="Remove range"
                                        >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
                <IndianRupee className="h-4 w-4 text-blue-600" />
                <AlertTitle>First-Time Rider Fees</AlertTitle>
                <AlertDescription>
                    A one-time joining fee of ₹1000 and a fully refundable security deposit of ₹1750 will be collected during verification.
                </AlertDescription>
            </Alert>
        </div>
    );
}
