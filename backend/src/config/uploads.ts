import path from 'path';
import fs from 'fs';

export const isServerless =
  !!process.env.NETLIFY ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.NETLIFY_BLOBS_SITE_ID ||
  !!process.env.NETLIFY_SITE_ID ||
  !!process.env.NETLIFY_BLOBS_TOKEN ||
  !!process.env.NETLIFY_API_TOKEN;

export const uploadDir = isServerless
  ? path.join('/tmp', 'uploads')
  : path.resolve(process.cwd(), 'uploads');

export const ensureUploadDir = async (): Promise<void> => {
  await fs.promises.mkdir(uploadDir, { recursive: true });
};
