'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        setLastUpdated(new Date().toLocaleDateString());
    }, []);

    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-4xl mx-auto rounded-2xl shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-4xl">Privacy Policy</CardTitle>
                    <CardDescription>Last updated: {lastUpdated}</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-lg dark:prose-invert max-w-none">
                    <p>Welcome to ZapGo. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.</p>

                    <h2 className="font-headline">1. Information We Collect</h2>
                    <p>We collect personal information that you voluntarily provide to us when you register on the app, express an interest in obtaining information about us or our products and services, when you participate in activities on the app or otherwise when you contact us.</p>

                    <h2 className="font-headline">2. How We Use Your Information</h2>
                    <p>We use personal information collected via our app for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>

                    <h2 className="font-headline">3. Will Your Information Be Shared?</h2>
                    <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

                    <h2 className="font-headline">4. How Long We Keep Your Information</h2>
                    <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law.</p>

                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                </CardContent>
            </Card>
        </div>
    );
}
