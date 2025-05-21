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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
  console.log(
    "HelpPanel()",
    "code=" + JSON.stringify(code, null, 2),
    "help=" + JSON.stringify(help, null, 2),
  );
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
    currentCode: code, // Pass the current code from the code panel
  });

  // We'll need to auto-scroll to the bottom when new messages arrive

  // Parse CSV with proper handling of quoted values and values with spaces
  const parseCSVLine = (line) => {
    if (!line) return [];
    const result = [];
    let cell = '';
    let inQuotes = false;

    // If there are no commas, treat it as a single cell
    if (!line.includes(',')) {
      return [line.trim()];
    }

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && (i === 0 || line[i - 1] === ',')) {
        // Start of quoted cell
        inQuotes = true;
        continue;
      } else if (char === '"' && nextChar === '"' && inQuotes) {
        // Escaped quote inside quoted cell (RFC 4180)
        cell += '"';
        i++; // Skip next quote
        continue;
      } else if (char === '"' && (nextChar === ',' || !nextChar) && inQuotes) {
        // End of quoted cell
        inQuotes = false;
        if (nextChar === ',') i++; // Skip next comma
        result.push(cell.trim()); // Trim whitespace
        cell = '';
        continue;
      } else if (char === ',' && !inQuotes) {
        // Unquoted cell delimiter
        result.push(cell.trim()); // Trim whitespace
        cell = '';
        continue;
      }

      // Add character to current cell
      cell += char;
    }

    // Add the last cell
    if (cell !== '') {
      result.push(cell.trim()); // Trim whitespace
    }

    return result;
  };

  // Check if a single line looks like CSV data
  const isLineTabular = (line) => {
    if (!line || typeof line !== 'string') return false;

    // Count commas for CSV detection
    const commaCount = line.split(',').length - 1;
    
    // Check for quoted values that may contain spaces
    const hasQuotedValues = /"[^"]*"/.test(line);
    
    // Basic heuristic: if line has multiple commas, it's likely CSV
    return commaCount > 1 || (commaCount > 0 && hasQuotedValues);
  };

  // Identify tabular sections within mixed content
  const identifyTabularSections = (text) => {
    if (!text || typeof text !== 'string') return [];

    const lines = text.trim().split('\n');
    const sections = [];
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = isLineTabular(line);

      if (isTableLine) {
        if (!currentSection) {
          // Start a new table section
          currentSection = {
            type: 'table',
            startLine: i,
            endLine: i,
            lines: [line]
          };
        } else if (currentSection.type === 'table') {
          // Continue existing table section
          currentSection.lines.push(line);
          currentSection.endLine = i;
        } else {
          // End text section and start table section
          sections.push(currentSection);
          currentSection = {
            type: 'table',
            startLine: i,
            endLine: i,
            lines: [line]
          };
        }
      } else {
        // Handle non-table line
        if (!currentSection) {
          // Start a new text section
          currentSection = {
            type: 'text',
            startLine: i,
            endLine: i,
            lines: [line]
          };
        } else if (currentSection.type === 'text') {
          // Continue existing text section
          currentSection.lines.push(line);
          currentSection.endLine = i;
        } else {
          // Only end a table section if we have 2+ consecutive non-table lines
          // or this is a completely blank line after a table
          if ((i > 0 && !isLineTabular(lines[i-1])) || line.trim() === '') {
            sections.push(currentSection);
            currentSection = {
              type: 'text',
              startLine: i,
              endLine: i,
              lines: [line]
            };
          } else {
            // Otherwise consider it part of the table (could be a header or description)
            currentSection.lines.push(line);
            currentSection.endLine = i;
          }
        }
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // Post-process: merge very small table sections into text
    return sections.map(section => {
      if (section.type === 'table' && section.lines.length < 2) {
        return { ...section, type: 'text' };
      }
      return section;
    });
  };

  // Check if text is CSV data, with support for values that contain spaces
  const isTabularData = (text) => {
    if (!text || typeof text !== 'string') return false;

    // Simple check for CSV across multiple lines
    const lines = text.trim().split('\n');
    if (lines.length < 2) return false; // Need at least 2 lines for a table

    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (nonEmptyLines.length < 2) return false;

    // Basic check: does text contain commas?
    if (!text.includes(',')) return false;

    // Parse each line using our CSV parser that handles quoted values with spaces
    try {
      const parsedLines = nonEmptyLines.map(line => parseCSVLine(line));
      
      // Get the most common column count to handle slight inconsistencies
      const columnCounts = parsedLines.map(cols => cols.length);
      const mostCommonColumnCount = columnCounts.sort((a, b) => 
        columnCounts.filter(v => v === a).length - columnCounts.filter(v => v === b).length
      ).pop();
      
      // Check if most lines have a similar column count (allow ±1 for CSV tables which might have aligned sections)
      const consistentColumns = parsedLines.filter(
        cols => Math.abs(cols.length - mostCommonColumnCount) <= 1
      ).length / parsedLines.length >= 0.7; // At least 70% of lines should have consistent columns
      
      return consistentColumns && mostCommonColumnCount >= 2;
    } catch (e) {
      console.error("Error parsing CSV data:", e);
    }

    // Finally, check using the isLineTabular to detect if most lines look like CSV
    const tabularLineCount = nonEmptyLines.filter(isLineTabular).length;
    return tabularLineCount >= nonEmptyLines.length * 0.7; // 70% or more lines look tabular
  };

  // Convert CSV data to markdown table, with support for values that contain spaces
  const formatAsMarkdownTable = (text) => {
    const lines = text.trim().split('\n');

    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (nonEmptyLines.length < 2) return text; // Return original if not enough data

    // Parse the rows and columns using our CSV parser
    const rows = nonEmptyLines.map(line => {
      let cells;
      try {
        cells = parseCSVLine(line);
      } catch (e) {
        // Fallback to simple comma split if parser fails
        cells = line.split(',').map(cell => cell.trim());
      }

      // Escape pipe characters in cell content to avoid breaking markdown table
      return cells.map(cell => {
        // Clean up cell content
        let cleanCell = cell.trim().replace(/\|/g, '\\|');
        
        // Handle parentheses for negative values in financial data
        if (cleanCell.includes('(') && cleanCell.includes(')')) {
          // Convert (123) format to -123 for better readability if it looks like a number
          if (/^\(\s*\d[\d\s,.]*\)$/.test(cleanCell)) {
            cleanCell = '-' + cleanCell.replace(/[()]/g, '').trim();
          }
        }
        
        return cleanCell;
      });
    });

    // Create the markdown table
    let markdownTable = '';

    // Get max column count (in case rows have different column counts)
    const maxColumnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

    // First row is always the header in CSV
    const headerRow = [...rows[0]];
    const dataStartIndex = 1;

    // Ensure header has enough columns
    while (headerRow.length < maxColumnCount) {
      headerRow.push('Column ' + (headerRow.length + 1)); // Add default header names
    }
    markdownTable += '| ' + headerRow.join(' | ') + ' |\n';

    // Separator row
    markdownTable += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n';

    // Data rows
    for (let i = dataStartIndex; i < rows.length; i++) {
      // Ensure consistent column count by padding if necessary
      const paddedRow = [...rows[i]];
      while (paddedRow.length < maxColumnCount) {
        paddedRow.push('');
      }
      markdownTable += '| ' + paddedRow.join(' | ') + ' |\n';
    }

    return markdownTable;
  };

  // Process mixed content with text and tables
  const processMixedContent = (text) => {
    if (!text || typeof text !== 'string') return text;

    // If it's a simple all-table content, process as before
    if (isTabularData(text)) {
      return formatAsMarkdownTable(text);
    }

    // For mixed content, identify the sections
    const sections = identifyTabularSections(text);
    if (sections.length <= 1) return text; // Not mixed content

    // Process each section
    return sections.map(section => {
      if (section.type === 'table' && section.lines.length >= 2) {
        const tableText = section.lines.join('\n');
        if (isTabularData(tableText)) {
          return formatAsMarkdownTable(tableText);
        } else {
          return tableText;
        }
      } else {
        return section.lines.join('\n');
      }
    }).join('\n\n');
  };

  // Handle sending a new message
  const handleMessage = useCallback(async (userMessage, botResponse = null) => {
    console.log("Handling message, bot response:", botResponse ? botResponse.type : "none");

    // Process message to handle mixed content and format tables
    let processedUserMessage = processMixedContent(userMessage);

    // Add user message to the chat in chronological order (at the end)
    setHelp(prev => [
      ...prev,
      {
        user: processedUserMessage,
        help: getHelp(processedUserMessage),
        type: 'user'
      }
    ]);

    // Only add the bot's description to the chat if one is available
    const displayText = botResponse?.description || "Code generated and sent to editor.";

    // Store bot response with the current code for future reference
    setHelp(prev => [
      ...prev,
      {
        user: displayText,
        help: {
          type: botResponse?.type === 'code' ? 'code' : 'text',
          text: displayText,
          code: botResponse?.type === 'code' ? botResponse.text : undefined,  // Store the code in the help history
          model: botResponse?.model || 'unknown',
          usage: botResponse?.usage || {}
        },
        type: 'bot'
      }
    ]);

    // If the bot response is code, automatically update the code panel
    if (botResponse?.type === 'code' && typeof setCode === 'function') {
      console.log("Setting code panel with new code:",
        botResponse.text ? botResponse.text.substring(0, 50) + "..." : "none");
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

  // Function to handle deleting a message
  const handleDeleteMessagePair = (index) => {
    setHelp(prev => {
      const newHelp = [...prev];
      // If it's a user message and has a bot response after it, delete both
      if (newHelp[index].type === 'user' && index + 1 < newHelp.length && newHelp[index + 1].type === 'bot') {
        newHelp.splice(index, 2);
      } else {
        // Otherwise just delete the message
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

  // Function to prepare messages for display
  const prepareMessagesForDisplay = () => {
    // Find all user messages in chronological order (oldest to newest)
    const userMessages = help
      .filter(item => item.type === 'user')
      .map((msg, idx) => ({
        ...msg,
        index: help.indexOf(msg)
      }));
      // No more reverse() - maintaining chronological order

    // Find the last bot response
    const lastBotIndex = [...help].reverse().findIndex(item => item.type === 'bot');
    const lastBotResponse = lastBotIndex !== -1 ? help[help.length - 1 - lastBotIndex] : null;

    return {
      userMessages,
      lastBotResponse: lastBotResponse ? {
        ...lastBotResponse,
        index: help.indexOf(lastBotResponse)
      } : null
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Input field at the top */}
      <div ref={headerRef} className="flex-none sticky top-0 z-20 bg-white px-4 py-3 border-b shadow-md">
        <div className="flex justify-between items-center text-xs mb-2">
          <div className="font-light text-gray-500">
            Use <span className="font-medium border py-0.5 px-1 rounded-sm bg-[#f8f8f8]">Shift+Enter</span> for newlines, {' '}
            <span className="font-medium py-0.5">CSV</span> for tabular data, {' '}
            <span className="font-medium py-0.5 px-1 rounded-sm bg-[#f8f8f8] font-mono">```</span> for code.
            Press <span className="font-medium border py-0.5 px-1 rounded-sm bg-[#f8f8f8]">Enter</span> to send.
          </div>
          {help.length > 0 && (
            <button
              className="text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded transition-colors ml-4"
              onClick={handleClearAll}
              title="Clear conversation"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-1 pb-0">
            <TextEditor
              key={help.length === 0 ? 'empty' : 'has-content'}
              state={state}
              disabled={isLoading}
              placeholder={help.length > 0 ? "Reply to make changes..." : "How can I help you today?"}
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
              <span className="text-gray-500 ml-2 text-xs">Generating...</span>
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
        {/* Invisible element for auto-scrolling to top */}
        <div ref={messagesEndRef} />


        {help.length > 0 && (() => {
          const { lastBotResponse, userMessages } = prepareMessagesForDisplay();

          return (
            <>
              {/* Last bot response at the top */}
              {lastBotResponse && (
                <div className="mb-6">
                  <div className="text-left">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="text-sm prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={tomorrow}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            table({node, className, children, ...props}) {
                              return (
                                <div className="overflow-x-auto my-2 w-full">
                                  <table className="table-auto border-collapse w-full text-xs" {...props}>
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            thead({node, children, ...props}) {
                              return (
                                <thead className="bg-gray-100" {...props}>
                                  {children}
                                </thead>
                              );
                            },
                            tbody({node, children, ...props}) {
                              return (
                                <tbody className="divide-y divide-gray-200" {...props}>
                                  {children}
                                </tbody>
                              );
                            },
                            tr({node, children, ...props}) {
                              return (
                                <tr className="hover:bg-gray-50" {...props}>
                                  {children}
                                </tr>
                              );
                            },
                            th({node, children, ...props}) {
                              return (
                                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border whitespace-nowrap" {...props}>
                                  {children}
                                </th>
                              );
                            },
                            td({node, children, ...props}) {
                              return (
                                <td className="px-2 py-1 text-xs text-gray-500 border" {...props}>
                                  {children}
                                </td>
                              );
                            }
                          }}
                        >
                          {lastBotResponse.help.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider between assistant response and user history */}
              {lastBotResponse && userMessages.length > 0 && (
                <div className="flex items-center mb-6">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <div className="mx-4 text-xs text-gray-500">Requests</div>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              )}

              {/* User messages in chronological order, oldest first */}
              <div className="flex flex-wrap justify-start gap-2 items-start">
                {userMessages
                  // Displaying messages in chronological order
                  .map((message, index) => (
                    <div key={index} className="mb-2 relative group" style={{ maxWidth: '45%', alignSelf: 'flex-start' }}>
                      {/* Delete button for each user message */}
                      <button
                        className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 z-10"
                        onClick={() => handleDeleteMessagePair(message.index)}
                        title="Delete message"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="bg-blue-100 rounded-lg p-3 overflow-hidden">
                        <div className="text-sm prose prose-sm prose-blue max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({node, inline, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={tomorrow}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              table({node, className, children, ...props}) {
                                return (
                                  <div className="overflow-x-auto my-2 w-full">
                                    <table className="table-auto border-collapse w-full text-xs" {...props}>
                                      {children}
                                    </table>
                                  </div>
                                );
                              },
                              thead({node, children, ...props}) {
                                return (
                                  <thead className="bg-blue-50" {...props}>
                                    {children}
                                  </thead>
                                );
                              },
                              tbody({node, children, ...props}) {
                                return (
                                  <tbody className="divide-y divide-blue-100" {...props}>
                                    {children}
                                  </tbody>
                                );
                              },
                              tr({node, children, ...props}) {
                                return (
                                  <tr className="hover:bg-blue-50" {...props}>
                                    {children}
                                  </tr>
                                );
                              },
                              th({node, children, ...props}) {
                                return (
                                  <th className="px-2 py-1 text-left text-xs font-medium text-blue-600 uppercase tracking-wider border border-blue-200 whitespace-nowrap" {...props}>
                                    {children}
                                  </th>
                                );
                              },
                              td({node, children, ...props}) {
                                return (
                                  <td className="px-2 py-1 text-xs text-blue-700 border border-blue-200" {...props}>
                                    {children}
                                  </td>
                                );
                              }
                            }}
                          >
                            {message.user}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                ))}
              </div>

            </>
          );
        })()}
      </div>
    </div>
  );
};
