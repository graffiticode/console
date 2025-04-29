/*
  -- Add a delete button to each text box so the user can prune the dialog
  -- On save record the mapping from inputs to outputs in a vector database
  -- Use the vector database to generate a few-shot context for the prompt
  -- share the vector database across languages
  -- use compiler errors to give feedback to the lm
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { TextEditor } from "./TextEditor";
import { createState } from "../lib/state";
import { generateCode } from "../utils/swr/fetchers";
import { ChatBot } from './ChatBot';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

const getHelp = prompt => (
  prompt.indexOf("code:") >= 0 && {
    type: "code",
    text: prompt.slice(prompt.indexOf("code:") + "code:".length).trim()
  } || {
    text: prompt,
  }
);

export const HelpPanel = ({
  help,
  setHelp,
  language,
  code,
  setCode
}) => {
  const [data, setData] = useState({});
  const messageInputRef = useRef(null);
  const { user } = useGraffiticodeAuth();

  // ChatBot integration
  const { handleSendMessage, isLoading } = ChatBot({
    onSendMessage: (userMessage, botResponse) => {
      // When we receive a message from the chatbot
      handleMessage(userMessage, botResponse);
    },
    user,
    language,
  });

  // No need to scroll since messages are in reverse chronological order (newest at top)

  // Handle sending a new message
  const handleMessage = useCallback(async (userMessage, botResponse = null) => {
    // Add user message to the chat
    setHelp(prev => [
      {
        user: userMessage,
        help: getHelp(userMessage),
        type: 'user'
      },
      ...prev
    ]);

    // Add bot response to the chat
    setHelp(prev => [
      {
        user: botResponse.text,
        help: {
          type: botResponse.type === 'code' ? 'code' : 'text',
          text: botResponse.text,
          model: botResponse.model,
          language: botResponse.language || 'ocaml',
          usage: botResponse.usage
        },
        type: 'bot'
      },
      ...prev
    ]);
  }, []);

  // State for the input field
  const [messageText, setMessageText] = useState('');

  // Integration with TextEditor component
  const [state] = useState(createState({}, (data, { type, args }) => {
    switch (type) {
      case "update":
        if (args.content && !isLoading) {
          handleSendMessage(args.content);
        }
        return {
          ...data,
          ...args,
        };
      default:
        console.error(false, `Unimplemented action type: ${type}`);
        return data;
    }
  }));

  // Function to format token usage display
  const formatTokenUsage = (usage) => {
    if (!usage) return "";
    return `Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens}`;
  };

  // Function to handle deleting a message pair (prompt and response)
  const handleDeleteMessagePair = (index) => {
    setHelp(prev => {
      const newHelp = [...prev];
      // Check if this is a user message and if the previous message is a bot response
      // In reversed chronological order, the bot response comes before the user message
      if (newHelp[index].type === 'user' && index - 1 >= 0 && newHelp[index - 1].type === 'bot') {
        // Remove both the user message and the corresponding bot response
        newHelp.splice(index - 1, 2);
      } else {
        // Just remove the single message as fallback
        newHelp.splice(index, 1);
      }
      return newHelp;
    });
  };

  // Function to clear all messages
  const handleClearAll = () => {
    setHelp([]);
  };

  if (typeof help === "string" && help.trim() !== "") {
    help = JSON.parse(help);
    if (typeof help === "string" && help.trim() !== "") {
      help = JSON.parse(help);
    }
  }

  // Create a ref to measure the header height
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(130);  // Default initial height

  // Update header height when it changes
  useEffect(() => {
    if (headerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setHeaderHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(headerRef.current);

      // Initial height measurement
      setHeaderHeight(headerRef.current.offsetHeight);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Update header height when loading state changes
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Fixed height header containing input field and controls */}
      <div ref={headerRef} className="flex-none sticky top-0 z-20 bg-white px-4 py-2 border-b shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-semibold text-gray-500">
            What would you like to make with Graffiticode?
          </div>
          {help.length > 0 && (
            <button
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded transition-colors"
              onClick={handleClearAll}
              title="Clear all messages"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="text-xs font-light text-gray-500 mt-1 mb-2">
          Press <span className="font-medium border py-0.5 px-1 rounded-sm bg-[#f8f8f8]">Enter</span> to send.
          Use <span className="font-medium border py-0.5 px-1 rounded-sm bg-[#f8f8f8]">Shift+Enter</span> for a new line.
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-1 pb-0">
            <TextEditor
              state={state}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Loading indicator inside sticky container */}
        {isLoading && (
          <div className="flex items-center mt-3 mb-2">
            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg text-gray-600 border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="text-gray-500 ml-2 text-xs">Generating Graffiticode...</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable messages container - dynamically sized based on header height */}
      <div
        className="overflow-auto px-4 py-4"
        style={{
          height: `calc(100vh - ${headerHeight}px - 120px)`,
          marginTop: '8px',
          marginBottom: '8px'
        }}
      >
        {help.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Start by asking a question above.
          </div>
        )}
        {help.map((item, index) => (
          <div key={index} className={`mb-4 ${item.type === 'user' ? 'text-right' : 'text-left'} relative group`}>
            {/* Only show delete button on user messages */}
            {item.type === 'user' && (
              <button
                className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 z-10"
                onClick={() => handleDeleteMessagePair(index)}
                title="Delete conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {item.type === 'user' ? (
              <div className="inline-block max-w-3/4 bg-blue-100 rounded-lg p-3 text-left">
                <p className="text-sm">{item.user}</p>
              </div>
            ) : item.help?.type === 'code' ? (
              <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                <div className="relative">
                  <pre
                    className="bg-gray-800 text-gray-100 p-3 rounded overflow-auto text-xs font-mono max-h-[400px] pr-12"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#4B5563 #1F2937'
                    }}>
                    {item.help?.text}
                  </pre>
                  <div className="absolute top-2 right-5 flex space-x-1">
                    <button
                      className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded p-1"
                      onClick={() => {
                        // Get the current code from the help message
                        const codeFromHelp = item.help.text;
                        // Update the code in the code panel
                        if (typeof setCode === 'function') {
                          setCode(codeFromHelp);
                        }
                      }}
                      title="Refresh Code"
                    >
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
  <path fillRule="evenodd" d="M8 3.5c-.771 0-1.537.022-2.297.066a1.124 1.124 0 0 0-1.058 1.028l-.018.214a.75.75 0 1 1-1.495-.12l.018-.221a2.624 2.624 0 0 1 2.467-2.399 41.628 41.628 0 0 1 4.766 0 2.624 2.624 0 0 1 2.467 2.399c.056.662.097 1.329.122 2l.748-.748a.75.75 0 1 1 1.06 1.06l-2 2.001a.75.75 0 0 1-1.061 0l-2-1.999a.75.75 0 0 1 1.061-1.06l.689.688a39.89 39.89 0 0 0-.114-1.815 1.124 1.124 0 0 0-1.058-1.028A40.138 40.138 0 0 0 8 3.5ZM3.22 7.22a.75.75 0 0 1 1.061 0l2 2a.75.75 0 1 1-1.06 1.06l-.69-.69c.025.61.062 1.214.114 1.816.048.56.496.996 1.058 1.028a40.112 40.112 0 0 0 4.594 0 1.124 1.124 0 0 0 1.058-1.028 39.2 39.2 0 0 0 .018-.219.75.75 0 1 1 1.495.12l-.018.226a2.624 2.624 0 0 1-2.467 2.399 41.648 41.648 0 0 1-4.766 0 2.624 2.624 0 0 1-2.467-2.399 41.395 41.395 0 0 1-.122-2l-.748.748A.75.75 0 1 1 1.22 9.22l2-2Z" clipRule="evenodd" />
</svg>
                    </button>
                    <button
                      className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded p-1"
                      onClick={() => {
                        if (code) {
                          // Update this message with the current code from the code panel
                          setHelp(prev => prev.map((msg, idx) =>
                            idx === index ? {
                              ...msg,
                              help: {
                                ...msg.help,
                                text: code
                              },
                              user: code
                            } : msg
                          ));
                        }
                      }}
                      title="Pull Code"
                      disabled={!code}
                    >
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
  <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
  <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
</svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm">{item.help.text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};