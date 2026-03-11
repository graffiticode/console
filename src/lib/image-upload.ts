import { ref, uploadBytesResumable, getDownloadURL, listAll, getMetadata, updateMetadata } from 'firebase/storage';
import type { FirebaseStorage, UploadTask } from 'firebase/storage';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function displayName(storageName: string): string {
  const withoutUuid = storageName.replace(/^[a-f0-9-]+_/, '');
  return withoutUuid.replace(/\.[^.]+$/, '');
}

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

export interface ImageInfo {
  name: string;
  downloadURL: string;
  timeCreated: string;
  hash?: string;
  archived?: boolean;
}

export async function listUserImages(
  storage: FirebaseStorage,
  userId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<ImageInfo[]> {
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
        hash: metadata.customMetadata?.hash,
        archived: metadata.customMetadata?.archived === 'true',
      };
    }),
  );
  const filtered = includeArchived ? items : items.filter(item => !item.archived);
  filtered.sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());
  // Deduplicate by displayName — keep newest (first after sort)
  const seen = new Set<string>();
  return filtered.filter((item) => {
    const dn = displayName(item.name);
    const key = item.hash ? `${dn}|${item.hash}` : dn;
    if (seen.has(key)) return false;
    seen.add(key);
    // Also mark the plain name as seen so hashless dupes are filtered
    if (item.hash) seen.add(dn);
    return true;
  });
}

export async function archiveUserImage(
  storage: FirebaseStorage,
  userId: string,
  fileName: string,
): Promise<void> {
  const fileRef = ref(storage, `uploads/${userId}/${fileName}`);
  await updateMetadata(fileRef, { customMetadata: { archived: 'true' } });
}

export async function unarchiveUserImage(
  storage: FirebaseStorage,
  userId: string,
  fileName: string,
): Promise<void> {
  const fileRef = ref(storage, `uploads/${userId}/${fileName}`);
  await updateMetadata(fileRef, { customMetadata: { archived: 'false' } });
}

export function uploadImage(
  storage: FirebaseStorage,
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
  fileHash?: string,
): { promise: Promise<{ downloadURL: string; fileName: string }>; cancel: () => void } {
  const ext = file.name.split('.').pop() || 'png';
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const path = `uploads/${userId}/${uuid}_${sanitized}.${ext}`;
  const storageRef = ref(storage, path);
  const task: UploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: fileHash ? { hash: fileHash } : undefined,
  });

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

/** Upload with dedup: skip if same name+hash exists, rename if same name but different hash. */
export async function uploadImageDeduped(
  storage: FirebaseStorage,
  userId: string,
  file: File,
  existingImages: ImageInfo[],
  onProgress?: (percent: number) => void,
): Promise<{ downloadURL: string; fileName: string; skipped?: boolean }> {
  const hash = await computeFileHash(file);
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const ext = file.name.split('.').pop() || 'png';

  // Find images with the same base display name
  const sameNameImages = existingImages.filter(
    (img) => {
      const dn = displayName(img.name);
      return dn === baseName || /^.+\(\d+\)$/.test(dn) && dn.replace(/\(\d+\)$/, '').trim() === baseName;
    },
  );

  // Skip if exact duplicate: same name and (matching hash OR no hash on existing image)
  const exactDup = sameNameImages.find(
    (img) => displayName(img.name) === baseName && (!img.hash || img.hash === hash),
  );
  if (exactDup) {
    return { downloadURL: exactDup.downloadURL, fileName: file.name, skipped: true };
  }

  // Same name but different hash — add suffix
  let finalName = file.name;
  if (sameNameImages.length > 0) {
    finalName = `${baseName}(${sameNameImages.length}).${ext}`;
  }

  const renamedFile = new File([file], finalName, { type: file.type });
  const { promise } = uploadImage(storage, userId, renamedFile, onProgress, hash);
  return promise;
}
