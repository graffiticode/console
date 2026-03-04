import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { FirebaseStorage, UploadTask } from 'firebase/storage';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported image type: ${file.type}. Use PNG, JPEG, GIF, or WebP.`;
  }
  if (file.size > MAX_SIZE) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`;
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function uploadImage(
  storage: FirebaseStorage,
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
): { promise: Promise<{ downloadURL: string; fileName: string }>; cancel: () => void } {
  const ext = file.name.split('.').pop() || 'png';
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const path = `uploads/${userId}/${uuid}_${sanitized}.${ext}`;
  const storageRef = ref(storage, path);
  const task: UploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

  const promise = new Promise<{ downloadURL: string; fileName: string }>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve({ downloadURL, fileName: file.name });
      },
    );
  });

  return { promise, cancel: () => task.cancel() };
}
