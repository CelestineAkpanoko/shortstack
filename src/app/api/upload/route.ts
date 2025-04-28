import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "@/src/lib/auth"; // Use the wrapper function
import { uploadFileToDrive } from '@/src/lib/googleDrive';

export const config = {
    api: {
      bodyParser: false, // Disable built-in parser for file uploads
      responseLimit: false, // Remove response size limit
    },
  };

export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await getAuthSession();
    if (!session?.user?.id) { // Check for session and user ID
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data with a timeout
    const formData = await Promise.race([
      request.formData(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Form data parsing timed out')), 30000)
      ),
    ]);

    // Get the file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Set size limits
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File size exceeds 50MB limit'
      }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get file metadata
    const fileName = formData.get('fileName') as string || file.name;
    const mimeType = file.type;

    // Upload with a timeout
    const uploadPromise = uploadFileToDrive(buffer, fileName, mimeType);
    const result = await Promise.race([
      uploadPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timed out after 45 seconds')), 45000)
      ),
    ]);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      fileUrl: result.webViewLink,
      downloadUrl: result.downloadLink
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}