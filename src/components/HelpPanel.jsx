/*
  -- Add a delete button to each text box so the user can prune the dialog
  -- On save record the mapping from inputs to outputs in a vector database
  -- Use the vector database to generate a few-shot context for the prompt
  -- share the vector database across languages
  -- use compiler errors to give feedback to the lm
 */

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { TextEditor } from "./TextEditor";
import { createState } from "../lib/state";
import { generateCode } from "../utils/swr/fetchers";

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
  language
}) => {
  const [data, setData] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);

  const [state] = useState(createState({}, (data, { type, args }) => {
    // console.log("HelpPanel state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
      case "update":
        handleUserMessage(args.content);
        return {
          ...data,
          ...args,
        };
      default:
        console.error(false, `Unimplemented action type: ${type}`);
        return data;
    }
  }));

  const handleUserMessage = async (content) => {
    // Add user message to the chat
    setHelp(help => [
      {
        user: content,
        help: getHelp(content),
        type: 'user'
      },
      ...help,
    ]);

    try {
      setIsGenerating(true);
      
      // Call the generateCode API
      const result = await generateCode({
        prompt: content,
        language: language || undefined,
        options: {
          temperature: 0.7,
          maxTokens: 2000
        }
      });
      
      // Add bot response to the chat
      setHelp(help => [
        {
          user: result.code,
          help: {
            type: 'code',
            text: result.code,
            model: result.model,
            language: result.language,
            usage: result.usage
          },
          type: 'bot'
        },
        ...help,
      ]);
      
      setGeneratedCode(result);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating code:", error);
      
      // Add error message to the chat
      setHelp(help => [
        {
          user: "Error generating code: " + error.message,
          help: { text: "Error generating code: " + error.message },
          type: 'error'
        },
        ...help,
      ]);
      
      setIsGenerating(false);
    }
  };

  // Function to format token usage display
  const formatTokenUsage = (usage) => {
    if (!usage) return "";
    return `Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 mb-2 bg-gray-100 rounded-lg">
        <h3 className="text-md font-semibold mb-2">OCaml Code Assistant</h3>
        <p className="text-xs text-gray-600">
          Type a description of OCaml code you need, and the AI will generate it for you.
        </p>
      </div>
      
      <div className="flex-grow overflow-auto mb-4">
        {help.map((item, index) => (
          <div key={index} className={`mb-4 ${item.type === 'user' ? 'text-right' : 'text-left'}`}>
            {item.type === 'user' ? (
              <div className="inline-block max-w-3/4 bg-blue-100 rounded-lg p-3 text-left">
                <p className="text-sm">{item.user}</p>
              </div>
            ) : item.help.type === 'code' ? (
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold">
                    {item.help.language || "Code"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.help.usage && formatTokenUsage(item.help.usage)}
                  </span>
                </div>
                <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-xs font-mono">
                  {item.help.text}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm">{item.help.text}</p>
              </div>
            )}
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-pulse text-gray-500">Generating code...</div>
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <TextEditor 
          state={state} 
          placeholder="Describe the code you need..."
          disabled={isGenerating}
        />
        <div className="text-xs text-gray-500 px-2 mt-1">
          Press Enter to send. Use Shift+Enter for a new line.
        </div>
      </div>
    </div>
  );
}
