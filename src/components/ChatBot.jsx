import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCode } from "../utils/swr/fetchers";

/**
 * Function to generate Graffiticode responses using the generateCode function
 */
const generateBotResponse = async ({message, user, language, chatHistory = [], currentCode = ''}) => {
  try {
    // Use our fetcher function directly
    console.log(
      "generateBotResponse()",
      "currentCode length=" + (currentCode?.length || 0),
      "chatHistory length=" + (chatHistory?.length || 0),
      "first few chars of code=" + (currentCode?.substring(0, 30) + "..." || "none")
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

      // Include the current code as the Assistant's most recent output
      if (currentCode && currentCode.trim().length > 0) {
        conversationContext += "\nAssistant's latest generated code:\n```\n";
        conversationContext += currentCode;
        conversationContext += "\n```\n";
      }

      conversationContext += "\nNow, please address this new request:\n";
      contextualPrompt = conversationContext + message;
    }

    console.log(
      "ChatBot/generateBotResponse()",
      "contextualPrompt=" + contextualPrompt,
    );

    console.log(
      "ChatBot/generateCode() call",
      "currentCode length:", currentCode?.length || 0,
      "first 30 chars:", currentCode?.substring(0, 30) + "..." || "none"
    );

    const result = await generateCode({
      user,
      prompt: contextualPrompt,
      options: {
        temperature: 0.2,
        maxTokens: 2000
      },
      language,
      currentCode
    });

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
      text: 'Hello! What do you want to make with Graffiticode today?',
      type: 'text',
      description: 'Hello! What do you want to make with Graffiticode today?'
    };
  } else if (message.toLowerCase().includes('help')) {
    return {
      text: 'I can help you make things with Graffiticode. What specific functionality would you like me to implement?',
      type: 'text',
      description: 'I can help you make things with Graffiticode. What specific functionality would you like me to implement?'
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
export const ChatBot = ({ onSendMessage, user, language, chatHistory = [], currentCode = '' }) => {
  console.log(
    "ChatBot()",
    "currentCode length=" + (currentCode?.length || 0),
    "chatHistory length=" + (chatHistory?.length || 0),
  );

  const [isLoading, setIsLoading] = useState(false);

  // Reference to control cancellation
  const cancelGenerationRef = useRef(false);

  // Use refs to always have access to the latest props
  const chatHistoryRef = useRef(chatHistory);
  const currentCodeRef = useRef(currentCode);

  // Update refs when props change
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    console.log("ChatHistory ref updated, length:", chatHistory?.length || 0);
  }, [chatHistory]);

  useEffect(() => {
    currentCodeRef.current = currentCode;
    console.log("CurrentCode ref updated, length:", currentCode?.length || 0);
  }, [currentCode]);

  // Function to cancel the current code generation
  const cancelGeneration = useCallback(() => {
    console.log("Cancelling code generation");
    cancelGenerationRef.current = true;
    // Immediately set isLoading to false to unblock the UI
    setIsLoading(false);
  }, []);

  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Reset cancellation flag
    cancelGenerationRef.current = false;
    setIsLoading(true);

    // Immediately call onSendMessage with just the user message to display it
    // This will update the UI right away while code is being generated
    onSendMessage(message, null);

    try {
      // Access the latest values from refs
      const latestChatHistory = chatHistoryRef.current;
      const latestCode = currentCodeRef.current;

      console.log(
        "Sending message with latest values:",
        "code length:", latestCode?.length || 0,
        "history length:", latestChatHistory?.length || 0
      );

      // Check if generation has been cancelled before making the API call
      if (cancelGenerationRef.current) {
        console.log("Code generation was cancelled before API call");
        return;
      }

      // Get response from the bot with the latest values
      const response = await generateBotResponse({
        message,
        user,
        language,
        chatHistory: latestChatHistory,
        currentCode: latestCode
      });

      // Check if generation was cancelled while the API call was in progress
      if (cancelGenerationRef.current) {
        console.log("Code generation was cancelled during API call");
        return;
      }

      // Send the bot response to the parent component
      // We're using a special flag to indicate this is just the bot response
      // without needing to add the user message again
      if (response) {
        response.skipUserMessage = true;
      }
      onSendMessage(message, response);
    } catch (error) {
      // Only send error if not cancelled
      if (!cancelGenerationRef.current) {
        console.error('Error getting bot response:', error);
        const errorResponse = {
          text: 'I encountered an error processing your request. Please try again.',
          type: 'text',
          description: 'I encountered an error processing your request. Please try again.',
          skipUserMessage: true
        };
        onSendMessage(message, errorResponse);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSendMessage, user, language]); // Remove chatHistory and currentCode from dependencies

  return {
    handleSendMessage,
    cancelGeneration,
    isLoading,
  };
};
