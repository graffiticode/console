import React, { useState, useCallback } from 'react';
import { generateCode } from "../utils/swr/fetchers";

/**
 * Function to generate Graffiticode responses using the generateCode function
 */
const generateBotResponse = async (message, user) => {
  try {
    // Use our fetcher function directly
    console.log(
      "ChatBot/generateBotResponse()",
      "user=" + JSON.stringify(user),
    );
    const result = await generateCode({
      user,
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
      language: result.language || 'graffiticode',
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
      text: 'Hello! How can I help you with Graffiticode today?',
      type: 'text'
    };
  } else if (message.toLowerCase().includes('help')) {
    return {
      text: 'I can help you write Graffiticode. What specific functionality would you like me to implement?',
      type: 'text'
    };
  } else if (message.toLowerCase().includes('example')) {
    return {
      text: `let double = <x: add x x>..
let result = map (double) [1 2 3]..`,
      type: 'code',
      language: 'graffiticode'
    };
  } else {
    return {
      text: `let message = "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"..
let greeting = <name: concat "Hello, " name>..
greeting "user"..`,
      type: 'code',
      language: 'graffiticode'
    };
  }
};

/**
 * ChatBot component that provides a chat interface
 */
export const ChatBot = ({ onSendMessage, user }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      // Get response from the bot, passing the accessToken if available
      const response = await generateBotResponse(message, user);

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
  }, [onSendMessage, user]);

  return {
    handleSendMessage,
    isLoading,
  };
};
