import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth/config";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated with NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Return normalized user data from session
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id || '',
        name: session.user.name || 'User',
        email: session.user.email || '',
        imageUrl: session.user.image || '',
      }
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get user data' 
    }, { status: 500 });
  }
}
