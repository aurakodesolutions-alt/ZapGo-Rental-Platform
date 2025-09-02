import useSWRMutation from "swr/mutation";
export function useQuote() {
    return useSWRMutation("/api/v1/public/quote", async (url, { arg }) => {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(arg) });
        if (!r.ok) throw new Error("quote failed");
        return r.json();
    });
}