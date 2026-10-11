import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates and stores an uploaded file buffer
 */
export async function storeAsset({ buffer, fileName, mimeType, folder = 'threadcraft' }) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('UNSUPPORTED_FILE_TYPE: Only PNG, JPEG, and WebP are allowed.');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE: Upload size must not exceed 5MB.');
  }

  // If Cloudinary is configured
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            fileUrl: result.secure_url,
            originalName: fileName,
            mimeType,
            sizeBytes: buffer.length,
            width: result.width,
            height: result.height,
            storageProvider: 'cloudinary',
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Persistent Local Fallback in public/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Sanitize filename and create unique timestamped name
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitized}`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.promises.writeFile(filePath, buffer);

  return {
    fileUrl: `/uploads/${uniqueName}`,
    originalName: fileName,
    mimeType,
    sizeBytes: buffer.length,
    width: null,
    height: null,
    storageProvider: 'local',
  };
}
