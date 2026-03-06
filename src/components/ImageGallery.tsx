import React, { useState, useEffect, useCallback } from 'react';
import { getStorage } from 'firebase/storage';
import { useFirebaseApp } from 'reactfire';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { listUserImages, validateImageFile, uploadImageDeduped, deleteUserImage } from '../lib/image-upload';
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
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
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

  const handleClick = (img: ImageInfo, e: React.MouseEvent) => {
    const url = img.downloadURL;
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (e.metaKey || e.ctrlKey) {
        // Toggle individual item
        if (next.has(url)) {
          next.delete(url);
        } else {
          next.add(url);
        }
      } else {
        // Single select: toggle if already the only selection, otherwise select just this
        if (next.size === 1 && next.has(url)) {
          next.clear();
        } else {
          next.clear();
          next.add(url);
        }
      }
      return next;
    });
  };

  const buildMarkdown = (urls: Set<string>) => {
    return images
      .filter(img => urls.has(img.downloadURL))
      .map(img => `![${fileNameWithoutExt(img.name)}](${img.downloadURL})`)
      .join('\n');
  };

  const handleDelete = useCallback(async (img: ImageInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storage = getStorage(firebaseApp);
      await deleteUserImage(storage, user.uid, img.name);
      setImages(prev => prev.filter(i => i.downloadURL !== img.downloadURL));
      setSelectedUrls(prev => {
        const next = new Set(prev);
        next.delete(img.downloadURL);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  }, [firebaseApp, user?.uid]);

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
        <div className="flex flex-wrap gap-3">
          {images.map((img) => {
            const isSelected = selectedUrls.has(img.downloadURL);
            // When dragging, use all selected if this image is selected, otherwise just this image
            const dragUrls = isSelected && selectedUrls.size > 0 ? selectedUrls : new Set([img.downloadURL]);
            return (
              <button
                key={img.downloadURL}
                onClick={(e) => handleClick(img, e)}
                draggable
                onDragStart={(e) => {
                  const markdown = buildMarkdown(dragUrls);
                  e.dataTransfer.setData('text/plain', markdown);
                  e.dataTransfer.setData('application/x-gc-image', 'true');
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className={`group relative flex flex-col items-center p-2 rounded cursor-pointer border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span
                  onClick={(e) => handleDelete(img, e)}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white text-gray-500 text-xs cursor-pointer z-10"
                  title="Delete image"
                >
                  ✕
                </span>
                <img
                  src={img.downloadURL}
                  alt={fileNameWithoutExt(img.name)}
                  className="w-[100px] h-[100px] object-contain"
                />
                <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                  {fileNameWithoutExt(img.name)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
