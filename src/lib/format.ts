import { formatInTimeZone } from 'date-fns-tz';

/**
 * Formats a number as Indian Rupees (INR).
 * @param n - The number to format.
 * @returns The formatted currency string (e.g., "₹1,200.50").
 */
export const formatINR = (n: number | null | undefined) => {
    const num = n ?? 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: Number.isInteger(num) ? 0 : 2,
    }).format(num);
};

/**
 * Formats a date string, number, or Date object into a specified format in the Asia/Kolkata (IST) timezone.
 * @param d - The date to format.
 * @param fmt - The format string (defaults to 'dd MMM yyyy, h:mm a').
 * @returns The formatted date string in IST.
 */
export const formatIST = (d: Date | string | number | null | undefined, fmt = 'dd MMM yyyy, h:mm a') => {
    if (!d) return 'N/A';
    try {
        return formatInTimeZone(new Date(d), 'Asia/Kolkata', fmt);
    } catch (error) {
        console.error("Failed to format date:", d, error);
        return 'Invalid Date';
    }
};
