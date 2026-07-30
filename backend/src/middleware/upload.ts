import multer from 'multer';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Sempre em memória: o arquivo só toca disco/armazenamento depois de o
// conteúdo real (magic bytes) ser validado pelo controller.
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Tipo de arquivo inválido. Use JPEG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
});

export interface DetectedImageType {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: '.jpg' | '.png' | '.webp';
}

/**
 * Identifica o tipo real da imagem pelos magic bytes, sem confiar no MIME
 * declarado pelo cliente. Retorna null para qualquer conteúdo que não seja
 * JPEG, PNG ou WEBP (ex.: HTML/SVG disfarçado de imagem).
 */
export const detectImageType = (buffer: Buffer | undefined): DetectedImageType | null => {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: '.png' };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', extension: '.webp' };
  }

  return null;
};

export const IMAGE_LIMITS = {
  maxBytes: MAX_FILE_SIZE_BYTES,
  allowedTypes: ALLOWED_MIME_TYPES,
};
