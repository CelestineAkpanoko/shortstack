"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

// Change to default export
export default function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}