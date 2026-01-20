import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCode } from "../utils/swr/fetchers";

/**
 * Build a conversation summary from chat history for DSPy service
 */
const buildConversationSummary = (chatHistory: any[]) => {
  if (!chatHistory || chatHistory.length < 2) {
    return null;
  }

  // Extract previous user requests from chat history
  const previousRequests: string[] = [];
  const previousOutputs: string[] = [];

  // Get last 6 messages (3 exchanges)
  const limitedHistory = chatHistory.slice(-6);

  for (const item of limitedHistory) {
    if (item.type === 'user') {
      previousRequests.push(item.user);
    } else if (item.type === 'bot' && item.help?.type === 'code') {
      previousOutputs.push('[Generated code]');
    } else if (item.type === 'bot') {
      previousOutputs.push(item.user || '[Response]');
    }
  }

  // Calculate turn count (each exchange is a turn)
  const turnCount = Math.ceil(chatHistory.length / 2);

  return {
    turnCount,
    previousRequests: previousRequests.slice(-3), // Last 3 requests
    previousOutputs: previousOutputs.slice(-3), // Last 3 outputs
  };
};

/**
 * Function to generate Graffiticode responses using the generateCode function
 */
const generateBotResponse = async ({message, user, language, chatHistory = [], currentCode = ''}) => {
  try {
    // Use our fetcher function directly

    // Format chat history as context for the prompt
    let contextualPrompt = message;

    // Build conversation summary for DSPy service
    const conversationSummary = buildConversationSummary(chatHistory);

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



    const result = await generateCode({
      user,
      prompt: contextualPrompt,
      options: {
        temperature: 0.2,
        maxTokens: 2000
      },
      language,
      currentCode,
      conversationSummary
    });


    // Transform the response to match our expected format
    return {
      text: result.code,
      type: 'code',
      language: result.language || 'graffiticode',
      model: result.model,
      usage: result.usage,
      taskId: result.taskId,
      timestamp: new Date().toISOString()
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
  const timestamp = new Date().toISOString();
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return {
      text: 'Hello! What do you want to make with Graffiticode today?',
      type: 'text',
      timestamp
    };
  } else if (message.toLowerCase().includes('help')) {
    return {
      text: 'I can help you make things with Graffiticode. What specific functionality would you like me to implement?',
      type: 'text',
      timestamp
    };
  } else if (message.toLowerCase().includes('example')) {
    return {
      text: `let double = <x: add x x>..
let result = map (double) [1 2 3]..`,
      type: 'code',
      language: 'graffiticode',
      timestamp
    };
  } else {
    return {
      text: `let message = "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"..
let greeting = <name: concat "Hello, " name>..
greeting "user"..`,
      type: 'code',
      language: 'graffiticode',
      timestamp
    };
  }
};

/**
 * ChatBot component that provides a chat interface
 */
export const ChatBot = ({ onSendMessage, user, language, chatHistory = [], currentCode = '' }) => {

  const [isLoading, setIsLoading] = useState(false);

  // Reference to control cancellation
  const cancelGenerationRef = useRef(false);

  // Use refs to always have access to the latest props
  const chatHistoryRef = useRef(chatHistory);
  const currentCodeRef = useRef(currentCode);

  // Update refs when props change
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    currentCodeRef.current = currentCode;
  }, [currentCode]);

  // Function to cancel the current code generation
  const cancelGeneration = useCallback(() => {
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


      // Check if generation has been cancelled before making the API call
      if (cancelGenerationRef.current) {
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
        return;
      }

      // Send the bot response to the parent component
      // We're using a special flag to indicate this is just the bot response
      // without needing to add the user message again
      if (response) {
        (response as any).skipUserMessage = true;
      }
      onSendMessage(message, response);
    } catch (error) {
      // Only send error if not cancelled
      if (!cancelGenerationRef.current) {
        console.error('Error getting bot response:', error);
        const errorResponse = {
          text: 'I encountered an error processing your request. Please try again.',
          type: 'text',
          skipUserMessage: true,
          timestamp: new Date().toISOString()
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
