"use client";

import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Rider = {
    riderId: number | string;
    fullName: string;
    email: string;
    phone: string;
};

async function postJSON(url: string, { arg }: { arg: any }) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(arg) });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "Failed");
    return j;
}

export default function SettingsTab({ rider }: { rider: Rider }) {
    const [name, setName] = useState(rider.fullName);
    const [phone, setPhone] = useState(rider.phone);
    const [email, setEmail] = useState(rider.email);

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");

    const { trigger: saveProfile, isMutating: savingProfile } = useSWRMutation("/api/v1/rider/me/update", postJSON);
    const { trigger: changePassword, isMutating: savingPass } = useSWRMutation("/api/v1/rider/password", postJSON);

    const onSaveProfile = async () => {
        try {
            await saveProfile({ fullName: name, phone, email });
            alert("Profile updated");
        } catch (e: any) {
            alert(e.message || "Update failed");
        }
    };

    const onSavePassword = async () => {
        if (!current || !next || next !== confirm) {
            alert("Please fill password fields (new & confirm must match).");
            return;
        }
        try {
            await changePassword({ currentPassword: current, newPassword: next });
            setCurrent(""); setNext(""); setConfirm("");
            alert("Password changed");
        } catch (e: any) {
            alert(e.message || "Password change failed");
        }
    };

    const onLogout = async () => {
        await fetch("/api/v1/rider/logout", { method: "POST" });
        window.location.href = "/";
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl">
                <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <Label>Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <Button className="rounded-xl" disabled={savingProfile} onClick={onSaveProfile}>
                        {savingProfile ? "Saving…" : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Current Password</Label>
                        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                    </div>
                    <div>
                        <Label>New Password</Label>
                        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
                    </div>
                    <div>
                        <Label>Confirm New Password</Label>
                        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    <Button className="rounded-xl" variant="secondary" disabled={savingPass} onClick={onSavePassword}>
                        {savingPass ? "Updating…" : "Update Password"}
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-2xl md:col-span-2">
                <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
                <CardContent>
                    <Separator className="my-3" />
                    <Button variant="destructive" className="rounded-xl" onClick={onLogout}>Logout</Button>
                </CardContent>
            </Card>
        </div>
    );
}
