import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// You need to install uuid: npm install uuid @types/uuid

export async function POST(request: Request) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student ID from session
    const studentId = session.user.id;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('profileImage') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Create a unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${uuidv4()}-${file.name.replace(/\s/g, '_')}`;
    
    // Define path to save image
    // For production, you'd likely want to use a cloud storage solution
    // This is a simple local storage example - in production use S3/Cloudinary/etc.
    const path = join(process.cwd(), 'public/uploads', fileName);
    
    // Write file
    await writeFile(path, buffer);
    
    // URL path for the image
    const imageUrl = `/uploads/${fileName}`;
    
    // Update user profile in the database
    await db.student.update({
      where: { id: studentId },
      data: { profileImage: imageUrl }
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl: imageUrl 
    });
    
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}