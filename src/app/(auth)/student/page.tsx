'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';

import Image from "next/image";
import login_mascout from "@/public/assets/img/LoginMascout2ldpi.png";
import main_logo from "@/public/assets/img/Main Primary Logo - Colorfu Black Greenldpi.png";
import { LoginForm } from "@/src/components/login-form";


export default function StudentLoginPage() {
  const router = useRouter();
  const [schoolEmail, setSchoolEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolEmail, password }),
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Redirect to student dashboard
      router.push('/student/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center grid lg:grid-cols-2 ">
      <Card className="w-full h-full max-w-md mx-4 flex flex-col gap-4 p-6 md:p-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolEmail">School Email</Label>
              <Input
                id="schoolEmail"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                type="email"
                placeholder="your.name@school.edu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>Need help? Contact your teacher.</p>
        </CardFooter>
      </Card>

      {/* Right Panel */}
            <div className="relative w-full h-full hidden lg:flex flex-col items-center justify-center bg-[hsl(79,89%,43%)] py-10 px-6 lg:block overflow-hidden">
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <Image
                  src={login_mascout}
                  alt="Mascot Image"
                  width={350}
                  height={350}
                  className="mb-4"
                />
                <h1 className="text-3xl font-bold text-white mb-2">
                  Introducing a new learning experience
                </h1>
                <p className="text-md text-white leading-6">
                  Empower your kids to save smart, spend wisely, and grow their money
                  skills with our fun, interactive app. Let's build strong financial
                  habits together!
                </p>
              </div>
      
              {/* Semi-Circle Arc */}
              <div className="absolute -bottom-60 -left-5 w-[320px] h-[320px] bg-[hsl(79,65%,60%)] rounded-full"></div>
            </div>

    </div>
  );
}