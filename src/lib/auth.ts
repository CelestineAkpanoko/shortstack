import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function getAuthSession() {
  return await getServerSession(authOptions);
}