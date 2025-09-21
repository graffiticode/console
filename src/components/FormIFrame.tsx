import { Fragment, memo, useCallback, useEffect, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { isNonEmptyString } from "../utils";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

const useTaskIdFormUrl = ({ accessToken, lang, id, origin }) => {
  if (!id) {
    return "";
  }
  const [ protocol, host ] =
        document.location.host.indexOf("localhost") === 0 && ["http", "localhost:3100"] ||
        ["https", "api.graffiticode.org"];
  const params = new URLSearchParams();
  if (accessToken) {
    params.set("access_token", accessToken);
  }
  if (origin) {
    params.set("origin", origin);
  }
  return `${protocol}://${host}/form?lang=${lang}&id=${id}&${params.toString()}`;
};

const HEIGHTS = [150, 240, 360, 480, 640, 860, 1020];

const cache = {};

const IFrame = ({ id, src, setData, className, width, height, onFocus }) => {
  const iframeRef = useRef(null);
  const hasReceivedInitialData = useRef(false);
  const hasReceivedFocus = useRef(false);
  const currentIdRef = useRef(id);

  // Reset state when ID changes (new form loaded)
  useEffect(() => {
    if (currentIdRef.current !== id) {
      console.log('[FormIFrame] Form ID changed, resetting state');

      // Clear the cache for the old ID
      if (cache[currentIdRef.current]) {
        delete cache[currentIdRef.current];
      }

      // Update refs
      hasReceivedInitialData.current = false;
      hasReceivedFocus.current = false;
      currentIdRef.current = id;

      // Clear any existing focus
      const clearFocusEvent = new CustomEvent('formIFrameFocus', {
        detail: { focus: null }
      });
      window.dispatchEvent(clearFocusEvent);
    }
  }, [id]);

  useEffect(() => {
    const handleMessage = (event) => {

      // Skip if the message is from the same origin (not from iframe)
      if (event.origin === window.location.origin) {
        return;
      }

      // Check for focus events first
      if (event.data.focus) {
        console.log('[FormIFrame] Received focus event:', event.data.focus);
        hasReceivedFocus.current = true;
        onFocus && onFocus(event.data.focus);
        // Also dispatch a custom event that HelpPanel can listen to
        const focusEvent = new CustomEvent('formIFrameFocus', {
          detail: { focus: event.data.focus }
        });
        window.dispatchEvent(focusEvent);
        return;
      }

      // Check if this is form data (has title, instructions, validation, interaction)
      let data = null;

      // First check if data is keyed by ID
      if (event.data[id]) {
        data = event.data[id];
      }
      // Check if this is form structure data (from L0166 forms)
      else if (event.data && typeof event.data === 'object' &&
               ('title' in event.data || 'instructions' in event.data ||
                'validation' in event.data || 'interaction' in event.data)) {
        console.log('[FormIFrame] Detected L0166 form data structure');
        data = event.data;
      }

      if (!data) {
        return;
      }
      const hash = JSON.stringify(data);
      if (cache[id] !== hash) {
        cache[id] = hash;
        setData && setData(data);

        // For L0166 forms, send an initial focus event for cell A1
        if (!hasReceivedInitialData.current && !hasReceivedFocus.current && data) {
          hasReceivedInitialData.current = true;

          // Check if this is an L0166 form with interaction.cells
          if (data.interaction && data.interaction.cells && typeof data.interaction.cells === 'object') {
            console.log('[FormIFrame] L0166 form detected with cells:', Object.keys(data.interaction.cells));

            // Find the first valid cell (skip 'assess' and other non-cell keys)
            const cellKeys = Object.keys(data.interaction.cells).filter(key =>
              key.match(/^[A-Z]+\d+$/)  // Match cell names like A1, B2, etc.
            ).sort(); // Sort to get A1 first

            if (cellKeys.length > 0) {
              const firstCellName = cellKeys[0];
              const firstCellData = data.interaction.cells[firstCellName];

              console.log(`[FormIFrame] Sending initial focus for cell ${firstCellName}`);

              // Create a proper focus event
              const focusEvent = new CustomEvent('formIFrameFocus', {
                detail: {
                  focus: {
                    type: 'cell',
                    name: firstCellName,
                    value: firstCellData || { text: '' }
                  }
                }
              });

              // Delay slightly to ensure everything is initialized
              setTimeout(() => {
                window.dispatchEvent(focusEvent);
              }, 100);
            }
          } else {
            console.log('[FormIFrame] Not an L0166 form or no cells found');
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [id, onFocus]);

  // Request initial focus when iframe loads
  const handleIframeLoad = useCallback(() => {
    // Reset the flags when a new iframe loads
    hasReceivedInitialData.current = false;
    hasReceivedFocus.current = false;

    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Give the iframe time to initialize, then request current focus
      // This will work if the iframe implements getFocus handling
      setTimeout(() => {
        try {
          iframeRef.current.contentWindow.postMessage({ type: 'getFocus' }, '*');
        } catch (e) {
          console.log('[FormIFrame] Unable to request initial focus:', e);
        }
      }, 1500);
    }
  }, []);

  return (
    <iframe
      ref={iframeRef}
      id={id}
      src={src}
      key="1"
      className={className}
      style={{ width: "100%", height: height || "100vh", border: "none" }}
      onLoad={handleIframeLoad}
    />
  );
};

const getHeight = (height, newHeight) => {
  if (newHeight === height) {
    return height;
  } else if (newHeight > HEIGHTS[HEIGHTS.length - 1]) {
    return HEIGHTS[HEIGHTS.length - 1];
  } else {
    return HEIGHTS.find((h, i) => newHeight < h && h);
  }
};

export const FormIFrame = ({
  accessToken,
  lang,
  id,
  setData,
  setId,
  data,
  className,
  height,
  onFocus
}) => {
  const origin = window.location.origin;
  const src = useTaskIdFormUrl({accessToken, lang, id, origin});
  return (
    <IFrame
      id={id}
      src={src}
      setData={setData}
      onFocus={onFocus}
      className={className || "w-full h-full"}
      width="100%"
      height={height || "100vh"}
    />
  );
};
