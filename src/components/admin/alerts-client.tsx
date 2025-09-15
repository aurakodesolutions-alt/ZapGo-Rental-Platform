"use client";
import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Filter, RefreshCcw, BellPlus, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AlertsClient() {
    const [type, setType] = useState<string|undefined>(undefined);
    const [status, setStatus] = useState<string|undefined>("open");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("pageSize", "20");

    const { data, isLoading, mutate } = useSWR(`/api/v1/admin/alerts?${params.toString()}`, fetcher, { refreshInterval: 30000 });

    const onRefreshNow = async () => {
        await fetch("/api/v1/admin/alerts/refresh", { method: "POST", body: JSON.stringify({}) , headers: { "Content-Type":"application/json" }});
        mutate();
    };

    const act = async (id: number, action: "resolve" | "reopen" | "snooze", until?: Date) => {
        await fetch(`/api/v1/admin/alerts`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action, until: until?.toISOString() }),
        });
        mutate();
    };

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Type</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setType(undefined)}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setType("RENTAL_OVERDUE")}>Overdue</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setType("RENTAL_DUE_SOON")}>Due Soon</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setType("RENTAL_STARTING_SOON")}>Starting Soon</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><Clock className="mr-2 h-4 w-4" />Status</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setStatus(undefined)}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus("open")}>Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus("snoozed")}>Snoozed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus("closed")}>Closed</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Input placeholder="Search rider, phone, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-60" />
                <Button size="sm" variant="secondary" onClick={() => { setPage(1); }}>Apply</Button>

                <div className="ml-auto flex gap-2">
                    <Button size="sm" onClick={onRefreshNow}><RefreshCcw className="mr-2 h-4 w-4" />Refresh alerts</Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Rider</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Rental</TableHead>
                            <TableHead>Due/Starts</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></TableCell></TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No alerts.</TableCell></TableRow>
                        ) : rows.map((r: any) => (
                            <TableRow key={r.AlertId} className={cn(r.Type === "RENTAL_OVERDUE" && "bg-destructive/5")}>
                                <TableCell>
                                    {r.Type === "RENTAL_OVERDUE" && <Badge variant="destructive">Overdue</Badge>}
                                    {r.Type === "RENTAL_DUE_SOON" && <Badge>Due Soon</Badge>}
                                    {r.Type === "RENTAL_STARTING_SOON" && <Badge variant="secondary">Starting</Badge>}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{r.FullName}</div>
                                    <div className="text-xs text-muted-foreground">{r.Phone}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{r.Model}</div>
                                    <div className="text-xs text-muted-foreground">#{r.UniqueCode}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs text-muted-foreground">ID {r.RentId}</div>
                                    <div className="text-xs">{r.RentalStatus}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{new Date(r.DueDate).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{r.Message}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        r.Status === "open" && "bg-emerald-600",
                                        r.Status === "snoozed" && "bg-amber-600",
                                        r.Status === "closed" && "bg-muted text-foreground"
                                    )}>{r.Status}</Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {r.Status !== "closed" && (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => act(r.AlertId, "snooze", new Date(Date.now() + 24*3600*1000))}>Snooze 1d</Button>
                                            <Button size="sm" variant="ghost" onClick={() => act(r.AlertId, "snooze", new Date(Date.now() + 3*24*3600*1000))}>Snooze 3d</Button>
                                            <Button size="sm" variant="default" onClick={() => act(r.AlertId, "resolve")}><Check className="mr-2 h-4 w-4" />Resolve</Button>
                                        </>
                                    )}
                                    {r.Status === "closed" && <Button size="sm" variant="outline" onClick={() => act(r.AlertId, "reopen")}><BellPlus className="mr-2 h-4 w-4" />Reopen</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {total > 20 && (
                <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={page<=1} onClick={() => setPage(p => p-1)}>Prev</Button>
                    <div className="text-sm text-muted-foreground">Page {page}</div>
                    <Button size="sm" variant="outline" onClick={() => setPage(p => p+1)}>Next</Button>
                </div>
            )}
        </div>
    );
}
