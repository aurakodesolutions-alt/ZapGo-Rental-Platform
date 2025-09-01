export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

type JsonInit = Omit<RequestInit, "body"> & { body?: any };

export async function fetchJson<T>(url: string, init?: JsonInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body !== undefined && !(init.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
        ...init,
        headers,
        body:
            init?.body === undefined
                ? undefined
                : init.body instanceof FormData
                    ? init.body
                    : JSON.stringify(init.body),
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => undefined) : undefined;

    if (!res.ok) {
        const message = (data?.error as string) || res.statusText || "Request failed";
        throw new ApiError(message, res.status, data?.details);
    }
    return (data as T) ?? ({} as T);
}
