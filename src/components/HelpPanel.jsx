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
  accessToken,
  language
}) => {
  const [data, setData] = useState({});
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ChatBot integration
  const { handleSendMessage, isLoading } = ChatBot({
    onSendMessage: (userMessage, botResponse) => {
      // When we receive a message from the chatbot
      handleMessage(userMessage, botResponse);
    },
    accessToken
  });

  // Custom function to handle code generation specifically
  const handleCodeGeneration = async (content) => {
    try {
      // Call the generateCode API for OCaml
      const result = await generateCode({
        prompt: content,
        options: {
          temperature: 0.7,
          maxTokens: 2000
        }
      });

      return {
        text: result.code,
        type: 'code',
        model: result.model,
        language: result.language || 'ocaml',
        usage: result.usage
      };
    } catch (error) {
      console.error("Error generating code:", error);
      return {
        text: "Error generating code: " + error.message,
        type: 'error'
      };
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [help]);

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

    // If no bot response was provided, generate one
    if (!botResponse) {
      // Generate code since this is a code assistant
      botResponse = await handleCodeGeneration(userMessage);
    }

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

  // Handle submitting the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || isLoading) return;

    const message = messageText;
    setMessageText('');

    // Use the ChatBot's send message handler
    await handleSendMessage(message);
  };

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

  return (
    <div className="flex flex-col h-full">
      {/* Input field at the top, aligned with output boxes */}
      <div className="px-4 mb-4 py-2">
        <div className="text-sm font-semibold text-gray-500 block">
          Ask me anything.
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
      </div>

      {/* Loading indicator right below input */}
      {isLoading && (
        <div className="flex items-center px-4 mb-4">
          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg text-gray-600 border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <span className="text-gray-500 ml-2 text-xs">Generating Graffiticode...</span>
          </div>
        </div>
      )}

      {/* Messages in reverse chronological order */}
      <div className="flex-grow overflow-auto px-4">
        {help.map((item, index) => (
          <div key={index} className={`mb-4 ${item.type === 'user' ? 'text-right' : 'text-left'}`}>
            {item.type === 'user' ? (
              <div className="inline-block max-w-3/4 bg-blue-100 rounded-lg p-3 text-left">
                <p className="text-sm">{item.user}</p>
              </div>
            ) : item.help.type === 'code' ? (
              <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                {/*
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    {item.help.model && (
                      <span className="text-xs text-gray-500 ml-2">
                        {item.help.model}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.help.usage && formatTokenUsage(item.help.usage)}
                  </span>
                  </div>
                 */}
                <div className="relative">
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-xs font-mono">
                    {item.help.text}
                  </pre>
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded p-1"
                    onClick={() => {
                      navigator.clipboard.writeText(item.help.text);
                      // Optional: Show a toast or notification that code was copied
                    }}
                    title="Copy code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
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
}
