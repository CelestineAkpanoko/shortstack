import type { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/src/lib/db";
import bcrypt from "bcryptjs";

interface CustomUser extends User {
  firstName?: string;
  lastName?: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  debug: false, // Set this to false to disable debug logs
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          image: profile.picture,
          role: "TEACHER",
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // First check for teacher login (existing functionality)
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (user?.password) {
          const isValid = await bcrypt.compare(
            credentials.password, 
            user.password
          );

          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
            };
          }
        }
        
        // If teacher login fails, check for student login
        const student = await db.student.findUnique({
          where: { schoolEmail: credentials.email },
        });
        
        if (student?.password) {
          const isStudentValid = await bcrypt.compare(
            credentials.password,
            student.password
          );
          
          if (isStudentValid) {
            return {
              id: student.id,
              email: student.schoolEmail,
              name: `${student.firstName} ${student.lastName}`,
              role: "STUDENT",
              image: student.profileImage,
            };
          }
        }
        
        // If neither teacher nor student login succeeds, return null
        return null;
      },
    }),
  ],
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    createUser: async ({ user }) => {
      // Create TeacherProfile for new users with TEACHER role
      try {
        if (user.role === "TEACHER") {
          const existingProfile = await db.teacherProfile.findUnique({
            where: { userId: user.id }
          });
          
          if (!existingProfile) {
            await db.teacherProfile.create({
              data: {
                userId: user.id,
                firstName: (user as CustomUser).firstName || user.name?.split(' ')[0] || '',
                lastName: (user as CustomUser).lastName || user.name?.split(' ').slice(1).join(' ') || '',
              },
            });
            console.log(`Created TeacherProfile for new user ${user.id}`);
          }
        }
      } catch (error) {
        console.error("Error in createUser event:", error);
      }
    },
    signIn: async ({ user }) => {
      // Check and create TeacherProfile on sign in if it doesn't exist
      try {
        if (user.role === "TEACHER") {
          const userWithProfile = await db.user.findUnique({
            where: { id: user.id },
            include: { teacherProfile: true }
          });
          
          if (userWithProfile && !userWithProfile.teacherProfile) {
            await db.teacherProfile.create({
              data: {
                userId: user.id,
                firstName: (user as CustomUser).firstName || user.name?.split(' ')[0] || '',
                lastName: (user as CustomUser).lastName || user.name?.split(' ').slice(1).join(' ') || '',
              },
            });
            console.log(`Created TeacherProfile for existing user ${user.id} on sign in`);
          }
        }
      } catch (error) {
        console.error("Error in signIn event:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "TEACHER" | "STUDENT";
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle Google sign-in for teachers
      if (account?.provider === "google") {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email as string },
            include: { teacherProfile: true }
          });
          
          // If user exists but doesn't have a teacher profile, create one
          if (existingUser && !existingUser.teacherProfile) {
            await db.teacherProfile.create({
              data: {
                userId: existingUser.id,
                firstName: existingUser.firstName || (profile as any)?.given_name || "",
                lastName: existingUser.lastName || (profile as any)?.family_name || "",
              },
            });
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
          // Don't block the sign-in process if this fails
        }
      }
      return true;
    },
  },
  pages: {
    // Using conditional paths based on role would require custom handling
    // For now, keep the default paths
    signIn: '/teacher', // This will be overridden in the sign-in component
    error: '/login',
    signOut: '/teacher',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};