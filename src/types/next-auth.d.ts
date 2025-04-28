import NextAuth from "next-auth";
import { User as NextAuthUser } from "next-auth";

declare module "next-auth" {
  interface User extends NextAuthUser {
    id: string;
    firstName?: string;
    lastName?: string;
    role: "TEACHER" | "STUDENT";
  }

  interface Session {
    user: User;
  }
}