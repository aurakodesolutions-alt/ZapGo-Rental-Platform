
'use client';

// import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import Image from "next/image";
// import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    // const login = useAuthStore((state) => state.login);

    // const { register, handleSubmit, formState: { errors } } = useForm({
    //     defaultValues: { email: 'admin@zapgo.in', password: 'password' },
    // });

    // const onSubmit = (data: any) => {
    //     if (data.email === 'admin@zapgo.in' && data.password === 'Admin@123') {
    //         login({ id: 's-admin', name: 'Admin User', email: 'admin@zapgo.in', role: 'ADMIN' }, 'fake-jwt-token-admin');
    //         toast({ title: 'Login Successful', description: 'Welcome back, Admin!', variant: 'default' });
    //         router.push('/dashboard');
    //     } else if (data.email === 'ops@zapgo.in' && data.password === 'Ops@123') {
    //         login({ id: 's-ops', name: 'Ops User', email: 'ops@zapgo.in', role: 'STAFF', permissions:[] }, 'fake-jwt-token-staff');
    //         toast({ title: 'Login Successful', description: 'Welcome back, Ops User!', variant: 'default' });
    //         router.push('/dashboard');
    //     } else if (data.email === 'limited@zapgo.in' && data.password === 'Limited@123') {
    //         login({ id: 's-limited', name: 'Limited User', email: 'limited@zapgo.in', role: 'STAFF', permissions:[] }, 'fake-jwt-token-staff');
    //         toast({ title: 'Login Successful', description: 'Welcome back, Limited User!', variant: 'default' });
    //         router.push('/dashboard');
    //     }
    //     else {
    //         toast({
    //             title: 'Login Failed',
    //             description: 'Invalid email or password. Please try again.',
    //             variant: 'destructive',
    //         });
    //     }
    // };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background ">
            <Card className="mx-auto max-w-sm w-full rounded-2xl shadow-xl">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className={'dark:invert'}/>
                    </div>
                    <CardTitle className="text-2xl font-headline">ZapGo Admin Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={()=>{}} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"

                            />
                            {/*{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}*/}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"

                            />
                            {/*{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}*/}
                        </div>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                        {/*<div className="text-center text-sm text-muted-foreground space-y-2 pt-4">*/}
                        {/*    <p><strong>Admin:</strong> admin@zapgo.in / Admin@123</p>*/}
                        {/*    <p><strong>Ops:</strong> ops@zapgo.in / Ops@123</p>*/}
                        {/*    <p><strong>Limited:</strong> limited@zapgo.in / Limited@123</p>*/}
                        {/*</div>*/}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
