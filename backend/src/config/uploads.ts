import path from 'path';
import fs from 'fs';

export const uploadDir = path.resolve(process.cwd(), 'uploads');

export const ensureUploadDir = async (): Promise<void> => {
  await fs.promises.mkdir(uploadDir, { recursive: true });
};
