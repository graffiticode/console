import React, { useState, useEffect, useCallback } from 'react';
import { getStorage } from 'firebase/storage';
import { useFirebaseApp } from 'reactfire';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { listUserImages, validateImageFile, uploadImageDeduped } from '../lib/image-upload';
import type { ImageInfo } from '../lib/image-upload';

function fileNameWithoutExt(name: string): string {
  // Strip UUID prefix (uuid_name.ext -> name)
  const withoutUuid = name.replace(/^[a-f0-9-]+_/, '');
  return withoutUuid.replace(/\.[^.]+$/, '');
}

export function ImageGallery() {
  const firebaseApp = useFirebaseApp();
  const { user } = useGraffiticodeAuth();
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const storage = getStorage(firebaseApp);
      const result = await listUserImages(storage, user.uid);
      setImages(result);
    } catch (err) {
      setError('Failed to load images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [firebaseApp, user?.uid]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleCopy = async (img: ImageInfo) => {
    const label = fileNameWithoutExt(img.name);
    const markdown = `![${label}](${img.downloadURL})`;
    await navigator.clipboard.writeText(markdown);
    setCopiedUrl(img.downloadURL);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (!user?.uid || files.length === 0) return;
    const file = files[0];
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploadError(null);
    setUploadProgress(0);
    const storage = getStorage(firebaseApp);
    try {
      const result = await uploadImageDeduped(storage, user.uid, file, images, (percent) => {
        setUploadProgress(percent);
      });
      setUploadProgress(null);
      if (result.skipped) {
        setUploadError('Image already exists');
        setTimeout(() => setUploadError(null), 2000);
      } else {
        loadImages();
      }
    } catch (err) {
      setUploadError('Upload failed');
      setUploadProgress(null);
      console.error(err);
    }
  }, [firebaseApp, user?.uid, images, loadImages]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (!user?.uid) {
    return <div className="p-4 text-sm text-gray-500">Sign in to view images.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`p-3 min-h-[200px] ${dragging ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
      {uploadError && <div className="text-sm text-red-500 mb-2">{uploadError}</div>}
      {uploadProgress !== null && (
        <div className="mb-3">
          <div className="h-1.5 bg-gray-200 rounded">
            <div className="h-1.5 bg-blue-500 rounded" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
      {images.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-8">
          No images uploaded yet. Drag images here to upload.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <button
              key={img.downloadURL}
              onClick={() => handleCopy(img)}
              className="group relative flex flex-col items-center p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200"
            >
              <img
                src={img.downloadURL}
                alt={fileNameWithoutExt(img.name)}
                className="w-[100px] h-[100px] object-contain"
              />
              <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                {copiedUrl === img.downloadURL ? 'Copied!' : fileNameWithoutExt(img.name)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
