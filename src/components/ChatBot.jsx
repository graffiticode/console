import React, { useState, useCallback } from 'react';
import { generateCode } from "../utils/swr/fetchers";

/**
 * Function to generate OCaml code responses using the generateCode function
 */
const generateBotResponse = async (message, accessToken) => {
  try {
    // Use our fetcher function directly
    const result = await generateCode({
      prompt: message,
      options: {
        temperature: 0.2,
        maxTokens: 2000
      }
    });

    // Transform the response to match our expected format
    return {
      text: result.code,
      type: 'code',
      language: result.language || 'ocaml',
      model: result.model,
      usage: result.usage
    };
  } catch (error) {
    console.error('Error generating code:', error);
    return fallbackResponse(message);
  }
};

/**
 * Fallback response generator used when API calls fail
 */
const fallbackResponse = (message) => {
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return {
      text: 'Hello! How can I help you with OCaml today?',
      type: 'text'
    };
  } else if (message.toLowerCase().includes('help')) {
    return {
      text: 'I can help you write OCaml code. What specific functionality would you like me to implement?',
      type: 'text'
    };
  } else if (message.toLowerCase().includes('example')) {
    return {
      text: `(* Here's a simple OCaml example *)
let sum_list lst =
  List.fold_left (+) 0 lst

let () =
  let result = sum_list [1; 2; 3; 4; 5] in
  Printf.printf "Sum: %d\\n" result`,
      type: 'code',
      language: 'ocaml'
    };
  } else {
    return {
      text: `(* OCaml fallback response *)
(* You asked about: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}" *)
(* Here's a simple OCaml function *)

let greet name =
  Printf.printf "Hello, %s! I'll help you with OCaml code.\\n" name

let () = greet "user"`,
      type: 'code',
      language: 'ocaml'
    };
  }
};

/**
 * ChatBot component that provides a chat interface
 */
export const ChatBot = ({ onSendMessage, accessToken }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      // Get response from the bot, passing the accessToken if available
      const response = await generateBotResponse(message, accessToken);

      // Send the user message and bot response to the parent component
      onSendMessage(message, response);
    } catch (error) {
      console.error('Error getting bot response:', error);
      onSendMessage(message, {
        text: 'I encountered an error processing your request. Please try again.',
        type: 'text'
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSendMessage, accessToken]);

  return {
    handleSendMessage,
    isLoading,
  };
};