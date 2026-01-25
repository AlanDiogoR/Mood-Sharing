import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { isServerless, uploadDir } from '../config/uploads';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = isServerless
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ext || '.jpg';
        const filename = `${crypto.randomUUID()}${safeExt}`;
        cb(null, filename);
      },
    });

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Tipo de arquivo inválido. Use JPEG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
});

export const IMAGE_LIMITS = {
  maxBytes: MAX_FILE_SIZE_BYTES,
  allowedTypes: ALLOWED_MIME_TYPES,
};
