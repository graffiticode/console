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
    console.log('🎯 Editor useEffect triggered:');
    console.log('  - lang:', lang);
    console.log('  - mode:', mode);
    console.log('  - origin:', origin);
    console.log('  - editorOrigin:', editorOrigin);
    console.log('  - effectiveOrigin:', effectiveOrigin);
    console.log('  - itemId:', itemId);
    console.log('  - user:', user ? `${user.email} (${user.uid})` : 'not authenticated');

    if (!lang || mode !== 'editor' || !effectiveOrigin) {
      console.log('❌ Missing required parameters, returning early');
      return;
    }

    // Always refresh the sessionStorage when editor loads to ensure correct origin
    if (typeof window !== 'undefined') {
      const editorData = {
        origin: String(effectiveOrigin),
        itemId: itemId || null
      };
      sessionStorage.setItem('graffiticode:editor', JSON.stringify(editorData));
      console.log('💾 Set editor sessionStorage:', editorData);
    }

    // If editing an existing item, set up editor mode for the Gallery
    if (itemId) {
      console.log('✏️  EDIT MODE: Setting up to edit existing item:', itemId);
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
        console.log('💾 Stored itemId in localStorage:', itemId);
        console.log('💾 Stored language in localStorage:', `L${String(lang).padStart(4, '0')}`);
      }
      // Don't create a new item, just show the Gallery with the existing item
      return;
    }

    // If no ID and user is authenticated, create a new item (only once)
    if (user && !creationStarted.current) {
      console.log('➕ CREATE MODE: No itemId provided, creating new item');
      console.log('  - creationStarted.current:', creationStarted.current);
      creationStarted.current = true;
      handleCreateNewItem();
    } else if (!user) {
      console.log('⏳ Waiting for user authentication...');
    } else if (creationStarted.current) {
      console.log('🔄 Item creation already in progress');
    }
  }, [lang, itemId, mode, origin, editorOrigin, user]);

  const handleCreateNewItem = async () => {
    console.log('🚀 handleCreateNewItem started');
    setIsCreating(true);
    setError(null);
    const effectiveOrigin = origin || editorOrigin;

    try {
      // Create a new item
      const createParams = {
        user,
        lang: String(lang).padStart(4, '0'), // Ensure proper format (e.g., "0165")
        name: "Editor Question",
        taskId: null,
        mark: 1,
        help: "[]",
        code: "",
        isPublic: false
      };
      console.log('📦 Creating item with params:', createParams);

      const newItem = await createItem(createParams);
      console.log('✅ Item created successfully:', newItem);

      if (newItem && newItem.id) {
        setCreatedItemId(newItem.id);
        setIsCreating(false);

        // Send message back to parent window
        if (window.opener && effectiveOrigin) {
          const message = {
            type: 'item-created',
            itemId: newItem.id,
            lang: lang
          };
          console.log('📤 Sending postMessage to parent window:');
          console.log('  - Message:', message);
          console.log('  - Target origin:', String(effectiveOrigin));
          console.log('  - window.opener exists:', !!window.opener);

          window.opener.postMessage(message, String(effectiveOrigin));
          console.log('✅ PostMessage sent successfully');
        } else {
          console.log('⚠️  Cannot send postMessage:');
          console.log('  - window.opener:', !!window.opener);
          console.log('  - effectiveOrigin:', effectiveOrigin);
        }

        // Store the selected item ID in localStorage so it will be selected in the items view
        if (typeof window !== 'undefined') {
          localStorage.setItem('graffiticode:selected:itemId', newItem.id);
          console.log('💾 Stored new itemId in localStorage:', newItem.id);

          // Also set the language
          const langData = {
            id: parseInt(lang),
            name: `L${String(lang).padStart(4, '0')}`
          };
          localStorage.setItem('graffiticode:language', JSON.stringify(langData));
          console.log('💾 Stored language in localStorage:', langData);

          // Store editor mode data in sessionStorage
          const editorData = {
            origin: String(effectiveOrigin),
            itemId: newItem.id
          };
          sessionStorage.setItem('graffiticode:editor', JSON.stringify(editorData));
          console.log('💾 Stored editor data in sessionStorage:', editorData);
        }

        // Don't redirect, Gallery will be shown below
        console.log('✅ Item creation complete, Gallery will be shown');
      } else {
        throw new Error('Failed to create item - no ID returned');
      }
    } catch (error) {
      console.error("❌ Failed to create item:", error);
      console.error("  - Error message:", error.message);
      console.error("  - Error stack:", error.stack);
      setError(error.message || 'Failed to create item');
      setIsCreating(false);
      creationStarted.current = false; // Allow retry on error
    }
  };

  // Show sign in if user is not authenticated
  if (!user) {
    console.log('🔐 Rendering: Sign-in required view');
    return (
      <>
        <Head>
          <title>{getTitle()} - Editor Integration</title>
          <link rel="icon" type="image/png" href="favicon.png" />
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full">
            <h2 className="text-center text-2xl font-bold mb-4">Sign in to continue</h2>
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
    console.log('🎨 Rendering: Gallery view');
    console.log('  - createdItemId:', createdItemId);
    console.log('  - itemId:', itemId);
    console.log('  - lang:', lang);
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
    console.log('⏳ Rendering: Creating item loading view');
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
    console.log('❌ Rendering: Error view');
    console.log('  - Error:', error);
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
  console.log('⏳ Rendering: Default loading view');
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
