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
    chatHistory: help, // Pass the current help array as chat history
  });

  // We'll need to auto-scroll to the bottom when new messages arrive

  // Handle sending a new message
  const handleMessage = useCallback(async (userMessage, botResponse = null) => {
    // Add user message to the chat in chronological order (at the end)
    setHelp(prev => [
      ...prev,
      {
        user: userMessage,
        help: getHelp(userMessage),
        type: 'user'
      }
    ]);

    // Only add the bot's description to the chat if one is available
    const displayText = botResponse.description || "Code generated and sent to editor.";

    setHelp(prev => [
      ...prev,
      {
        user: displayText,
        help: {
          type: 'text',
          text: displayText,
          model: botResponse.model || 'unknown',
          usage: botResponse.usage || {}
        },
        type: 'bot'
      }
    ]);

    // If the bot response is code, automatically update the code panel
    if (botResponse.type === 'code' && typeof setCode === 'function') {
      setCode(botResponse.text);
    }
  }, [setCode]);

  // State for the input field
  const [messageText, setMessageText] = useState('');

  // Re-create ChatBot when help (chat history) changes
  // This ensures that new messages are included in the context
  useEffect(() => {
    console.log("Chat history updated, messages count:", help.length);
  }, [help]);

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
      // Check if this is a user message and if the next message is a bot response
      // In chronological order, the bot response comes after the user message
      if (newHelp[index].type === 'user' && index + 1 < newHelp.length && newHelp[index + 1].type === 'bot') {
        // Remove both the user message and the corresponding bot response
        newHelp.splice(index, 2);
      } else if (newHelp[index].type === 'bot' && index > 0 && newHelp[index - 1].type === 'user') {
        // If this is a bot message and the previous one is a user message
        // Remove both the user message and the bot response
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

  // Parse help if it's a string
  if (typeof help === "string" && help.trim() !== "") {
    try {
      help = JSON.parse(help);
      if (typeof help === "string" && help.trim() !== "") {
        help = JSON.parse(help);
      }
    } catch (e) {
      console.error("Error parsing help string:", e);
      help = [];
    }
  }

  // Ensure help is always an array
  if (!Array.isArray(help)) {
    help = [];
  }

  // Create refs to measure the header height and handle scrolling
  const headerRef = useRef(null);
  const messagesEndRef = useRef(null);
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

  // Function to create conversation pairs from messages
  const createConversationPairs = () => {
    const pairs = [];

    // First create pairs of user-bot messages from the original array
    for (let i = 0; i < help.length; i++) {
      if (help[i].type === 'user') {
        // Check if next message is a bot response
        const botResponse = i + 1 < help.length && help[i + 1].type === 'bot' ? help[i + 1] : null;
        pairs.push({
          user: help[i],
          bot: botResponse,
          index: i
        });

        // Skip the bot message in the next iteration if we found one
        if (botResponse) i++;
      } else if (help[i].type === 'bot') {
        // Handle orphaned bot messages (shouldn't happen normally)
        pairs.push({
          user: null,
          bot: help[i],
          index: i
        });
      }
    }

    // Reverse the pairs to show newest conversations first
    return pairs.reverse();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Input field at the top */}
      <div ref={headerRef} className="flex-none sticky top-0 z-20 bg-white px-4 py-3 border-b shadow-md">
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

      {/* Scrollable messages container - now takes most of the space */}
      <div
        className="flex-grow overflow-auto px-4 py-4"
        style={{
          height: 'calc(100vh - 240px)' // Adjusted to account for input at top
        }}
      >
        {help.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Start by asking a question above.
          </div>
        )}

        {/* Invisible element for auto-scrolling to top */}
        <div ref={messagesEndRef} />

        {/* Group messages into user-bot pairs and display in reverse chronological order */}
        {createConversationPairs().map((pair, pairIndex) => (
          <div key={pairIndex} className="mb-6 relative group">
            {/* Delete button for the entire pair */}
            <button
              className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 z-10"
              onClick={() => handleDeleteMessagePair(pair.index)}
              title="Delete conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* User message always displayed first/above */}
            {pair.user && (
              <div className="mb-2 text-right">
                <div className="inline-block max-w-3/4 bg-blue-100 rounded-lg p-3 text-left">
                  <p className="text-sm">{pair.user.user}</p>
                </div>
              </div>
            )}

            {/* Bot response displayed second/below the user message */}
            {pair.bot && (
              <div className="text-left">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm">{pair.bot.help.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
