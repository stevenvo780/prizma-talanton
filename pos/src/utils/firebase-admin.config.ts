import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const normalizePrivateKey = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  return trimmed.replace(/\\n/g, '\n');
};

if (!admin.apps.length) {
  try {
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    admin.initializeApp({
      credential:
        process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey
          ? admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey,
            })
          : undefined,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } catch (_error) {
    console.warn('[firebase-admin] explicit credential failed; booting without Firebase cert');
    admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
}
export default admin;
