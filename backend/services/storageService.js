import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local uploads directory
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Google Cloud Storage only if credentials are provided
let storage = null;
let bucketName = process.env.GCS_BUCKET_NAME || 'bidly-uploads';
let useLocalStorage = true;

if (process.env.GCP_PROJECT_ID && (process.env.GCS_KEY_FILE || process.env.GCS_CREDENTIALS)) {
  try {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE || undefined,
      credentials: process.env.GCS_CREDENTIALS ? JSON.parse(process.env.GCS_CREDENTIALS) : undefined,
    });
    useLocalStorage = false;
    console.log('✅ Google Cloud Storage configured');
  } catch (error) {
    console.warn('⚠️  Google Cloud Storage initialization failed, using local storage:', error.message);
    useLocalStorage = true;
  }
} else {
  console.log('📁 Using local file storage (GCS not configured)');
}

// Upload file locally
const uploadFileLocally = async (file, folder = 'uploads') => {
  try {
    const folderPath = path.join(uploadsDir, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(folderPath, uniqueName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Return URL that will be served by Express static
    const fileUrl = `/uploads/${folder}/${uniqueName}`;
    
    return {
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    throw new Error(`Failed to upload file locally: ${error.message}`);
  }
};

// Upload file to GCS
const uploadFileToGCS = async (file, folder = 'uploads') => {
  try {
    const bucket = storage.bucket(bucketName);
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });
    
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });
      
      stream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        resolve({
          fileUrl: publicUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
      });
      
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Failed to upload file to GCS: ${error.message}`);
  }
};

// Main upload function - uses local or GCS based on configuration
export const uploadFile = async (file, folder = 'uploads') => {
  if (useLocalStorage) {
    return uploadFileLocally(file, folder);
  } else {
    return uploadFileToGCS(file, folder);
  }
};

// Get signed URL for private file access (if needed)
export const getSignedUrl = async (fileName, expiresInMinutes = 60) => {
  if (useLocalStorage) {
    // For local storage, just return the local URL
    return fileName;
  }
  
  if (!storage) {
    throw new Error('Google Cloud Storage is not configured');
  }
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    
    return url;
  } catch (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

// Delete file
export const deleteFile = async (fileUrl) => {
  if (useLocalStorage) {
    try {
      const filePath = path.join(__dirname, '../..', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete local file:', error);
      return false;
    }
  }
  
  if (!storage) {
    return false;
  }
  try {
    const bucket = storage.bucket(bucketName);
    const fileName = fileUrl.replace(`https://storage.googleapis.com/${bucketName}/`, '');
    await bucket.file(fileName).delete();
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

// Export uploads directory path for Express static serving
export const getUploadsDir = () => uploadsDir;
