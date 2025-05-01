import React, { useState, useCallback } from 'react';
import { generateCode } from "../utils/swr/fetchers";

/**
 * Function to generate Graffiticode responses using the generateCode function
 */
const generateBotResponse = async ({message, user, language, chatHistory = []}) => {
  try {
    // Use our fetcher function directly
    console.log(
      "ChatBot/generateBotResponse()",
      "user=" + JSON.stringify(user),
      "language=" + language,
      "chatHistory length=" + chatHistory.length
    );

    // Format chat history as context for the prompt
    let contextualPrompt = message;

    // Only add chat history if there's a meaningful amount (at least 1 exchange)
    if (chatHistory.length >= 2) {
      // Build context from the chat history
      let conversationContext = "Previous conversation:\n\n";

      // Add a limited number of previous exchanges as context (last 3 exchanges)
      const limitedHistory = chatHistory.slice(-6); // Get last 6 messages (3 exchanges)

      for (let i = 0; i < limitedHistory.length; i++) {
        const item = limitedHistory[i];
        if (item.type === 'user') {
          conversationContext += `User: ${item.user}\n`;
        } else if (item.type === 'bot') {
          // For bot responses, include either the text (if a description) or a summary (if code)
          if (item.help && item.help.type === 'code') {
            conversationContext += `Assistant: [Generated Graffiticode code]\n`;
            // If there's a description, include it
            if (item.help.description) {
              conversationContext += `Description: ${item.help.description}\n`;
            }
          } else {
            conversationContext += `Assistant: ${item.user}\n`;
          }
        }
      }

      conversationContext += "\nNow, please address this new request:\n";
      contextualPrompt = conversationContext + message;
    }

    console.log("Using contextual prompt:", contextualPrompt.substring(0, 200) + "...");

    const result = await generateCode({
      user,
      prompt: contextualPrompt,
      options: {
        temperature: 0.2,
        maxTokens: 2000
      },
      language,
    });
    console.log(
      "ChatBot/generateBotResponse()",
      "result=" + JSON.stringify(result),
    );

    // Log just the first part of the description for development purposes
    if (result.description) {
      const previewLength = Math.min(50, result.description.length);
      console.log("Generated description:", result.description.substring(0, previewLength) +
                  (result.description.length > previewLength ? "..." : ""));
    }

    // Transform the response to match our expected format
    return {
      text: result.code,
      type: 'code',
      description: result.description || '',  // Use the actual description from the API
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
      type: 'text',
      description: 'Hello! How can I help you with Graffiticode today?'
    };
  } else if (message.toLowerCase().includes('help')) {
    return {
      text: 'I can help you write Graffiticode. What specific functionality would you like me to implement?',
      type: 'text',
      description: 'I can help you write Graffiticode. What specific functionality would you like me to implement?'
    };
  } else if (message.toLowerCase().includes('example')) {
    return {
      text: `let double = <x: add x x>..
let result = map (double) [1 2 3]..`,
      type: 'code',
      language: 'graffiticode',
      description: 'This code creates a function to double numbers and applies it to the list [1, 2, 3], resulting in [2, 4, 6].'
    };
  } else {
    return {
      text: `let message = "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"..
let greeting = <name: concat "Hello, " name>..
greeting "user"..`,
      type: 'code',
      language: 'graffiticode',
      description: 'This code creates a greeting function that adds "Hello, " before a name, and then applies it to "user".'
    };
  }
};

/**
 * ChatBot component that provides a chat interface
 */
export const ChatBot = ({ onSendMessage, user, language, chatHistory = [] }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      // Get response from the bot, passing the accessToken and chat history
      const response = await generateBotResponse({
        message,
        user,
        language,
        chatHistory
      });

      // Send the user message and bot response to the parent component
      onSendMessage(message, response);
    } catch (error) {
      console.error('Error getting bot response:', error);
      onSendMessage(message, {
        text: 'I encountered an error processing your request. Please try again.',
        type: 'text',
        description: 'I encountered an error processing your request. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSendMessage, user, language, chatHistory]);

  return {
    handleSendMessage,
    isLoading,
  };
};
