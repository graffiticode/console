import { ref, uploadBytesResumable, getDownloadURL, listAll, getMetadata } from 'firebase/storage';
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

export async function listUserImages(
  storage: FirebaseStorage,
  userId: string,
): Promise<{ name: string; downloadURL: string; timeCreated: string }[]> {
  const folderRef = ref(storage, `uploads/${userId}/`);
  const result = await listAll(folderRef);
  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const [downloadURL, metadata] = await Promise.all([
        getDownloadURL(itemRef),
        getMetadata(itemRef),
      ]);
      return {
        name: itemRef.name,
        downloadURL,
        timeCreated: metadata.timeCreated,
      };
    }),
  );
  items.sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());
  return items;
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
