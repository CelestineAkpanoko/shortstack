'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from "next/image";
import Link from "next/link";
import login_mascout from "@/public/assets/img/LoginMascout2ldpi.png";
import { EyeOff, Eye, AlertCircle } from "lucide-react";

// Only use dynamic to prevent caching
export const dynamic = 'force-dynamic';

export default function StudentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Format the error message appropriately
        let errorMessage = result.error;
        if (errorMessage === "CredentialsSignin") {
          errorMessage = "Invalid email or password. Please try again.";
        }
        setError(errorMessage);
      } else if (result?.ok) {
        // Check if it's a student account
        const session = await fetch("/api/auth/session");
        const sessionData = await session.json();
        
        if (sessionData?.user?.role === "STUDENT") {
          router.push("/student/dashboard");
        } else {
          router.push("/dashboard"); // Default dashboard for teachers
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-1">Student Sign in</h1>
          {/* <p className="text-gray-600 mb-6">
            Don't have an account? <Link href="/register" className="text-green-600 hover:text-green-700 underline">Create now</Link>
          </p> */}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="@#*%"
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md pr-10 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? 
                    <Eye size={20} className="text-gray-500" /> : 
                    <EyeOff size={20} className="text-gray-500" />
                  }
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded text-green-600 focus:ring-green-500"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div> */}
              <label className="text-sm text-green-600 hover:underline">
                Forgot Password? Contact your teacher.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#97d700] text-white font-semibold rounded-md hover:bg-[#86c000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel with correct green color */}
      <div className="hidden lg:block lg:w-1/2 bg-[#97d700] relative overflow-hidden">
        {/* Content and mascot */}
        <div className="flex flex-col items-center justify-center h-full text-center px-10">
          <Image
            src={login_mascout}
            alt="Mascot Image"
            width={400}
            height={400}
            className="mb-6"
            priority
          />
          <h1 className="text-3xl font-bold text-white mb-4">
          Ready to learn about finances?
          </h1>
          <p className="text-md font-semibold text-white max-w-lg text-center">
            Log in with the credentials provided by your teacher to access your dashboard, join a class with your class code,
             and start your journey towards financial literacy.
          </p>
        </div>
        
        {/* Single arch in bottom left */}
        <div className="absolute -bottom-60 -left-5 w-[320px] h-[320px] bg-[hsl(79,65%,60%)] rounded-full"></div>
      </div>
    </div>
  );
}