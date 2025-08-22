import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { createItem } from '../utils/swr/fetchers';
import { getTitle } from '../lib/utils';
import SignIn from '../components/SignIn';
import Gallery from '../components/gallery';

export default function Editor({ language, setLanguage, mark }) {
  const router = useRouter();
  const { lang: rawLang, itemId, mode, origin, editorMode, editorOrigin } = router.query;
  const lang = Array.isArray(rawLang) ? rawLang[0] : rawLang;
  const { user } = useGraffiticodeAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [createdItemId, setCreatedItemId] = useState(null);
  const [error, setError] = useState(null);
  const creationStarted = useRef(false);

  useEffect(() => {
    // Only proceed if we have the necessary parameters
    const effectiveOrigin = origin || editorOrigin;
    console.log('Editor useEffect - lang:', lang, 'mode:', mode, 'effectiveOrigin:', effectiveOrigin, 'itemId:', itemId);

    if (!lang || mode !== 'editor' || !effectiveOrigin) {
      return;
    }

    // Always refresh the sessionStorage when editor loads to ensure correct origin
    if (typeof window !== 'undefined') {
      const editorData = {
        origin: String(effectiveOrigin),
        itemId: itemId || null
      };
      sessionStorage.setItem('graffiticode:editor', JSON.stringify(editorData));
      console.log('Set editor sessionStorage:', editorData);
    }

    // If editing an existing item, set up editor mode for the Gallery
    if (itemId) {
      // Store editor mode data in sessionStorage so Gallery knows to send messages
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('graffiticode:editor', JSON.stringify({
          origin: String(effectiveOrigin),
          itemId: itemId
        }));
        // Also set the selected item and language in localStorage
        localStorage.setItem('graffiticode:selected:itemId', String(itemId));
        localStorage.setItem('graffiticode:language', JSON.stringify({
          id: parseInt(lang),
          name: `L${String(lang).padStart(4, '0')}`
        }));
      }
      // Don't create a new item, just show the Gallery with the existing item
      return;
    }

    // If no ID and user is authenticated, create a new item (only once)
    if (user && !creationStarted.current) {
      creationStarted.current = true;
      handleCreateNewItem();
    }
  }, [lang, itemId, mode, origin, editorOrigin, user]);

  const handleCreateNewItem = async () => {
    setIsCreating(true);
    setError(null);
    const effectiveOrigin = origin || editorOrigin;

    try {
      // Create a new item
      const newItem = await createItem({
        user,
        lang: String(lang).padStart(4, '0'), // Ensure proper format (e.g., "0165")
        name: "Editor Question",
        taskId: null,
        mark: 1,
        help: "[]",
        code: "",
        isPublic: false
      });

      if (newItem && newItem.id) {
        setCreatedItemId(newItem.id);
        setIsCreating(false);

        // Send message back to parent window
        if (window.opener && effectiveOrigin) {
          window.opener.postMessage({
            type: 'item-created',
            itemId: newItem.id,
            lang: lang
          }, String(effectiveOrigin));
        }

        // Store the selected item ID in localStorage so it will be selected in the items view
        if (typeof window !== 'undefined') {
          localStorage.setItem('graffiticode:selected:itemId', newItem.id);
          // Also set the language
          localStorage.setItem('graffiticode:language', JSON.stringify({
            id: parseInt(lang),
            name: `L${String(lang).padStart(4, '0')}`
          }));
          // Store editor mode data in sessionStorage
          sessionStorage.setItem('graffiticode:editor', JSON.stringify({
            origin: String(effectiveOrigin),
            itemId: newItem.id
          }));
        }

        // Don't redirect, Gallery will be shown below
      } else {
        throw new Error('Failed to create item');
      }
    } catch (error) {
      console.error("Failed to create item:", error);
      setError(error.message || 'Failed to create item');
      setIsCreating(false);
      creationStarted.current = false; // Allow retry on error
    }
  };

  // Show sign in if user is not authenticated
  if (!user) {
    return (
      <>
        <Head>
          <title>{getTitle()} - Editor Integration</title>
          <link rel="icon" type="image/png" href="favicon.png" />
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full">
            <h2 className="text-center text-2xl font-bold mb-4">Sign in to Continue</h2>
            <p className="text-center text-gray-600 mb-8">
              Graffiticode account required to create or edit questions
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => window.open('https://graffiticode.com', '_blank')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Open Graffiticode to Sign In
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show Gallery UI when we have a created item or are in editor mode
  if (createdItemId || (mode === 'editor' && itemId)) {
    return (
      <>
        <Head>
          <title>{getTitle()} - Editor</title>
          <link rel="icon" type="image/png" href="favicon.png" />
        </Head>
        <Gallery
          lang={lang}
          mark={mark}
          hideItemsNav={true}
        />
      </>
    );
  }

  // Show loading state while creating item or redirecting
  if (isCreating) {
    return (
      <>
        <Head>
          <title>{getTitle()} - Creating Item</title>
          <link rel="icon" type="image/png" href="favicon.png" />
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Creating new question...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <Head>
          <title>{getTitle()} - Error</title>
          <link rel="icon" type="image/png" href="favicon.png" />
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleCreateNewItem}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // Default loading state
  return (
    <>
      <Head>
        <title>{getTitle()} - Loading</title>
        <link rel="icon" type="image/png" href="favicon.png" />
      </Head>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    </>
  );
}
