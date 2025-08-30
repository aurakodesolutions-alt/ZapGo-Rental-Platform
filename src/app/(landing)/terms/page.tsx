'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        setLastUpdated(new Date().toLocaleDateString());
    }, []);

    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-4xl mx-auto rounded-2xl shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-4xl">Terms of Service</CardTitle>
                    <CardDescription>Last updated: {lastUpdated}</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-lg dark:prose-invert max-w-none">
                    <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the ZapGo mobile application (the "Service") operated by ZapGo ("us", "we", or "our").</p>

                    <h2 className="font-headline">1. Agreement to Terms</h2>
                    <p>By using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>

                    <h2 className="font-headline">2. Accounts</h2>
                    <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

                    <h2 className="font-headline">3. User Conduct</h2>
                    <p>You agree not to use the Service to:
                        <ul>
                            <li>Violate any local, state, national, or international law.</li>
                            <li>Engage in any activity that is harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or otherwise objectionable.</li>
                            <li>Operate the scooter in a reckless or unsafe manner.</li>
                        </ul>
                    </p>

                    <h2 className="font-headline">4. Termination</h2>
                    <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                </CardContent>
            </Card>
        </div>
    );
}
