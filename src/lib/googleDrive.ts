import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { GaxiosResponse } from 'gaxios';

// Convert Buffer to Readable Stream
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal the end of the stream
  return stream;
}

// Keep a cache of folder IDs to avoid repeated lookups
const folderCache: Record<string, string> = {};

// Configure Google Drive API client
function getDriveClient(): drive_v3.Drive {
  // Use service account for server-side operations
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

// Create folders if they don't exist
export async function createFolderIfNotExists(folderName: string): Promise<string> {
  // Check cache first
  if (folderCache[folderName]) {
    return folderCache[folderName];
  }
  
  const drive = getDriveClient();
  
  // Check if folder exists
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files && response.data.files.length > 0) {
    // Cache the folder ID
    const folderId = response.data.files[0].id;
    if (folderId) {
      folderCache[folderName] = folderId;
      return folderId;
    } else {
      throw new Error(`Folder ID for '${folderName}' is undefined or null.`);
    }
  }

  // Create folder if it doesn't exist
  const fileMetadata: drive_v3.Schema$File = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });
  
  // Cache the new folder ID
  const newFolderId = folder.data.id;
  if (!newFolderId) {
    throw new Error(`Failed to create folder '${folderName}', folder ID is undefined.`);
  }
  folderCache[folderName] = newFolderId;
  return newFolderId;
}

interface DriveUploadResult {
  success: boolean;
  fileId: string;
  webViewLink: string;
  downloadLink: string;
}

export async function uploadFileToDrive(
  file: Buffer, 
  fileName: string, 
  mimeType: string
): Promise<DriveUploadResult> {
  try {
    const drive = getDriveClient();
    
    // Ensure the uploads folder exists (using cache when possible)
    const folderId = await createFolderIfNotExists('shortstack_uploads');
    
    // Convert buffer to stream
    const fileStream = bufferToStream(file);
    
    // Upload file to Google Drive
    const response: GaxiosResponse<drive_v3.Schema$File> = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: fileStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Failed to upload file to Google Drive');
    }
    
    // Make the file publicly accessible with a link
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return direct web and download links
    return {
      success: true,
      fileId: fileId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      downloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}