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
import { useDropzone } from 'react-dropzone';
import { createPortal } from 'react-dom';

// Add custom CSS for dropzone
const dropzoneStyles = `
  .drag-active {
    position: relative;
  }
  
  .drag-active::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(59, 130, 246, 0.08);
    border: 2px dashed rgba(59, 130, 246, 0.5);
    border-radius: 0.5rem;
    z-index: 40;
    pointer-events: none;
  }
`;

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null);

  // Create a ref for the state to avoid circular dependencies
  const stateRef = useRef(null);

  // Integration with TextEditor component - will be properly initialized after ChatBot setup
  const [state] = useState(createState({}, (data, { type, args }) => {
    switch (type) {
      case "update":
        // Handle message sending only if we have the right functions
        if (args.content && data.handleSendMessage && !data.isLoading) {
          data.handleSendMessage(args.content);
        }
        return {
          ...data,
          ...args,
        };
      case "csv-upload":
        // For CSV uploads, we don't want to trigger handleSendMessage
        // We just want to update the editor content
        console.log("CSV upload:", args.filename);
        return {
          ...data,
          content: args.content,
        };
      case "config":
        // For configuring the state with handlers
        return {
          ...data,
          ...args
        };
      default:
        console.error(false, `Unimplemented action type: ${type}`);
        return data;
    }
  }));

  // Handle file drop functionality for the entire panel
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    console.log("Dropped file:", file.name);

    // Read the file contents
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      let updateSuccess = false;

      // Wait a moment to ensure the editor is accessible
      setTimeout(() => {
        // Try direct DOM manipulation first - most reliable method
        try {
          // Try to find the editor in multiple ways
          const editorElement =
            document.querySelector("[contenteditable=true]") ||
            document.querySelector(".ProseMirror") ||
            document.querySelector("[role='textbox']");

          if (editorElement) {
            console.log("Found editor element:", editorElement);
            // Focus and clear the editor
            editorElement.focus();

            // Try multiple approaches to insert text
            try {
              // Modern approach
              document.execCommand('selectAll', false, null);
              document.execCommand('delete', false, null);
              document.execCommand('insertText', false, fileContent);
              updateSuccess = true;
              console.log("Successfully inserted content via execCommand");
            } catch (insertErr) {
              console.error("execCommand insertion failed:", insertErr);

              // Try direct innerHTML approach
              try {
                editorElement.innerHTML = '';
                editorElement.innerHTML = fileContent.replace(/\n/g, '<br>');
                updateSuccess = true;
                console.log("Successfully inserted content via innerHTML");
              } catch (innerErr) {
                console.error("innerHTML insertion failed:", innerErr);
              }
            }
          } else {
            console.error("Could not find editor element");
          }
        } catch (err) {
          console.error("DOM manipulation failed:", err);
        }

        // Try state update as a fallback
        if (!updateSuccess && state && typeof state.apply === 'function') {
          try {
            state.apply({
              type: 'csv-upload',
              args: {
                content: fileContent
              }
            });
            updateSuccess = true;
            console.log("Successfully updated content via state update");
          } catch (err) {
            console.error("State update failed:", err);
          }
        }

        // Show appropriate notification
        if (updateSuccess) {
          setUploadNotification({
            type: 'success',
            message: `File "${file.name}" loaded into editor`,
            fileName: file.name
          });
        } else {
          // Last resort: copy to clipboard
          try {
            // First try the modern clipboard API
            navigator.clipboard.writeText(fileContent)
              .then(() => {
                setUploadNotification({
                  type: 'warning',
                  message: `File content copied to clipboard. Press Ctrl+V or Cmd+V to paste.`,
                  fileName: file.name
                });
              })
              .catch((clipErr) => {
                console.error("Clipboard API failed:", clipErr);
                // Fallback: show error notification
                setUploadNotification({
                  type: 'error',
                  message: `Could not process file. Please try copying and pasting manually.`,
                  fileName: file.name
                });
              });
          } catch (clipErr) {
            console.error("Clipboard operation failed:", clipErr);
            setUploadNotification({
              type: 'error',
              message: `Could not process file`,
              fileName: file.name
            });
          }
        }

        // Close the modal if it's open
        setShowUploadModal(false);

        // Clear notification after 3 seconds
        setTimeout(() => {
          setUploadNotification(null);
        }, 3000);
      }, 100); // Small delay to ensure DOM is ready
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setUploadNotification({
        type: 'error',
        message: 'Error reading file',
        fileName: file.name
      });

      // Close the modal
      setShowUploadModal(false);

      // Clear notification after 3 seconds
      setTimeout(() => {
        setUploadNotification(null);
      }, 3000);
    };

    // Read the file as text
    reader.readAsText(file);
  }, [state]);

  // ChatBot integration
  const { handleSendMessage, cancelGeneration, isLoading } = ChatBot({
    onSendMessage: (userMessage, botResponse) => {
      // When we receive a message from the chatbot
      handleMessage(userMessage, botResponse);
    },
    user,
    language,
    chatHistory: help, // Pass the current help array as chat history
    currentCode: code, // Pass the current code from the code panel
  });

  // Setup dropzone for the entire panel
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.csv', '.json', '.xml', '.md', '.log', '.conf', '.cfg', '.ini', '.yaml', '.yml', '.toml', '.gc'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'application/x-yaml': ['.yaml', '.yml'],
      'application/toml': ['.toml'],
      'text/plain': ['.txt', '.text', '.log', '.gc'],
      'text/csv': ['.csv'],
      'text/markdown': ['.md', '.markdown'],
      'text/x-python': ['.py'],
      'text/x-java': ['.java'],
      'text/javascript': ['.js', '.mjs', '.jsx'],
      'text/typescript': ['.ts', '.tsx'],
      'text/x-c': ['.c', '.h'],
      'text/x-c++': ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'],
      'text/x-ruby': ['.rb'],
      'text/x-go': ['.go'],
      'text/x-rust': ['.rs'],
      'text/html': ['.html', '.htm'],
      'text/css': ['.css', '.scss', '.sass'],
      'application/x-sh': ['.sh', '.bash'],
      'text/x-sql': ['.sql']
    },
    maxFiles: 1,
    noClick: true, // Don't open file dialog on click, only accept drops
    noKeyboard: true // Disable keyboard interaction
  });

  // We'll need to auto-scroll to the bottom when new messages arrive

  // Parse CSV with proper handling of quoted values and values with spaces
  const parseCSVLine = (line) => {
    if (!line) return [];
    const result = [];
    let cell = '';
    let inQuotes = false;
    let isQuotedCell = false;

    // If there are no commas, treat it as a single cell
    if (!line.includes(',')) {
      const trimmed = line.trim();
      // Handle case of a single quoted value
      if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
        return [trimmed.substring(1, trimmed.length - 1)];
      }
      return [trimmed];
    }

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && (i === 0 || line[i - 1] === ',' || /\s/.test(line[i - 1]))) {
        // Start of quoted cell
        inQuotes = true;
        isQuotedCell = true;
        // Skip the opening quote (don't add to cell)
        continue;
      } else if (char === '"' && nextChar === '"' && inQuotes) {
        // Escaped quote inside quoted cell (RFC 4180)
        cell += '"';
        i++; // Skip next quote
        continue;
      } else if (char === '"' && (nextChar === ',' || !nextChar || /\s/.test(nextChar)) && inQuotes) {
        // End of quoted cell
        inQuotes = false;
        // Skip the closing quote (don't add to cell)
        if (nextChar === ',') i++; // Skip next comma
        result.push(cell.trim()); // Trim whitespace
        cell = '';
        isQuotedCell = false;
        continue;
      } else if (char === ',' && !inQuotes) {
        // Unquoted cell delimiter
        result.push(cell.trim()); // Trim whitespace
        cell = '';
        isQuotedCell = false;
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

    // Trim the line to remove whitespace that might affect detection
    const trimmedLine = line.trim();
    if (trimmedLine === '') return false;
    // Check if line starts with characters that suggest it's a heading, not data
    const isPotentialHeading = /^(#|\*|-|\d+\.|>)/.test(trimmedLine);
    // Check for quoted values that may contain commas
    const hasQuotedValues = /"[^"]*"/.test(trimmedLine);
    // If we have quoted values, try parsing with our CSV parser to get actual cell count
    if (hasQuotedValues) {
      try {
        const cells = parseCSVLine(trimmedLine);
        // If we have at least 2 columns after parsing, it's likely CSV
        if (cells.length >= 2) {
          return true;
        }
      } catch (e) {
        console.error("Error parsing line with quotes for CSV detection:", e);
      }
    }
    // Count commas for CSV detection (for non-quoted values or as fallback)
    const commaCount = trimmedLine.split(',').length - 1;

    // If it looks like a markdown heading or list item and only has 0-1 commas, don't treat as CSV
    if (isPotentialHeading && commaCount <= 1) return false;

    // Basic heuristic: if line has multiple commas, it's likely CSV
    // Note: We require at least 1 comma (2 fields) for better accuracy
    return commaCount >= 1;
  };

  // Identify tabular sections within mixed content
  const identifyTabularSections = (text) => {
    if (!text || typeof text !== 'string') return [];

    const lines = text.trim().split('\n');
    const sections = [];
    let currentSection = null;

    // Store consecutive non-table line count to better handle transitions
    let consecutiveNonTableLines = 0;

    // Single-line input should never be treated as a table
    if (lines.length === 1) {
      return [{
        type: 'text',
        startLine: 0,
        endLine: 0,
        lines: [lines[0]]
      }];
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = isLineTabular(line);

      // Empty lines don't break table sections, just skip them for analysis
      if (line.trim() === '') {
        if (currentSection) {
          // Add empty lines to current section
          currentSection.lines.push(line);
          currentSection.endLine = i;
        }
        continue;
      }

      if (isTableLine) {
        // Reset the counter when we find a table line
        consecutiveNonTableLines = 0;

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
        // It's a non-table line
        consecutiveNonTableLines++;

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
          // Currently in a table section

          // End table section if:
          // 1. We have consecutive non-table lines, or
          // 2. This line is completely empty and follows a table
          if (consecutiveNonTableLines >= 2) {
            sections.push(currentSection);
            currentSection = {
              type: 'text',
              startLine: i,
              endLine: i,
              lines: [line]
            };
          } else {
            // Otherwise treat it as header/description text that's part of the table
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

    // Post-process: merge very small table sections into text and ensure sections are properly separated
    const processedSections = sections.map(section => {
      // Single-line tables can be valid if they have enough columns
      if (section.type === 'table' && section.lines.length === 1) {
        const line = section.lines[0];
        // Check if this single line has enough commas to be a valid table
        const commaCount = (line.match(/,/g) || []).length;
        const hasQuotedValues = /"[^"]*"/.test(line);
        // Keep as table if it has enough commas or quoted values with commas
        if (commaCount >= 2 || (commaCount >= 1 && hasQuotedValues)) {
          try {
            const cells = parseCSVLine(line);
            if (cells.length >= 2) {
              return section; // Keep as table if it has at least 2 cells
            }
          } catch (e) {
            console.error("Error parsing single-line table section:", e);
          }
        }
        return { ...section, type: 'text' }; // Convert to text if not a valid table
      }
      // Multi-line tables need at least 2 lines to be valid
      if (section.type === 'table' && section.lines.length < 2) {
        return { ...section, type: 'text' };
      }
      return section;
    });

    console.log("Identified sections:", processedSections.map(s => s.type));

    return processedSections;
  };

  // Check if text is CSV data, with support for values that contain spaces
  const isTabularData = (text) => {
    if (!text || typeof text !== 'string') return false;

    // Simple check for CSV across multiple lines
    const lines = text.trim().split('\n');
    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    // Check if any lines contain quoted values
    const linesWithQuotes = nonEmptyLines.filter(line => /"[^"]*"/.test(line));
    const hasQuotedValues = linesWithQuotes.length > 0;
    console.log(`CSV detection starting with ${nonEmptyLines.length} lines, ${linesWithQuotes.length} contain quotes`);
    // Check for adjacent rows with matching cell counts - required for CSV detection
    if (nonEmptyLines.length >= 2) {
      try {
        // Parse all lines to get cell counts
        const parsedLines = nonEmptyLines.map(line => {
          try {
            return parseCSVLine(line);
          } catch (e) {
            return [line]; // If parsing fails, treat as single cell
          }
        });

        // Find at least one pair of adjacent rows with matching cell counts (and >= 2 cells)
        let hasAdjacentMatch = false;
        for (let i = 0; i < parsedLines.length - 1; i++) {
          const currentCellCount = parsedLines[i].length;
          const nextCellCount = parsedLines[i + 1].length;

          // Both rows must have at least 2 cells and same count (±1 for flexibility)
          if (currentCellCount >= 2 && nextCellCount >= 2 &&
              Math.abs(currentCellCount - nextCellCount) <= 1) {
            hasAdjacentMatch = true;
            console.log(`Found adjacent rows with matching cell counts: row ${i} (${currentCellCount} cells) and row ${i+1} (${nextCellCount} cells)`);
            break;
          }
        }

        if (hasAdjacentMatch) {
          // Additional check: ensure at least 60% of lines have similar cell counts
          const cellCounts = parsedLines.map(cells => cells.length);
          const mostCommonCount = cellCounts.sort((a, b) =>
            cellCounts.filter(v => v === a).length - cellCounts.filter(v => v === b).length
          ).pop();

          const consistentLines = cellCounts.filter(count =>
            count >= 2 && Math.abs(count - mostCommonCount) <= 1
          ).length;
          const consistentRatio = consistentLines / cellCounts.length;

          console.log(`CSV consistency check: ${consistentLines}/${cellCounts.length} lines (${(consistentRatio * 100).toFixed(1)}%) have consistent cell counts`);

          if (consistentRatio >= 0.6) {
            console.log("Detected CSV based on adjacent row matching and consistency");
            return true;
          }
        } else {
          console.log("No adjacent rows with matching cell counts found - not CSV");
        }
      } catch (e) {
        console.error("Error checking for adjacent row matches:", e);
      }
    }
    // Single line check - NEVER consider a single line as CSV, regardless of commas
    if (nonEmptyLines.length === 1) {
      console.log("Single line detected - not treating as CSV (requires at least 2 rows)");
      return false;
    }
    // If we don't have at least 2 non-empty lines, it's not a multi-line CSV
    if (nonEmptyLines.length < 2) return false;

    // For text with quoted values, we need a more careful approach
    if (hasQuotedValues) {
      console.log("CSV contains quoted values, using cell-based detection");
      try {
        // Parse each line using our CSV parser that properly handles quoted values
        const parsedLines = nonEmptyLines.map(line => parseCSVLine(line));
        // Count how many lines have at least 2 cells after parsing
        const validLines = parsedLines.filter(cells => cells.length >= 2);
        const validRatio = validLines.length / nonEmptyLines.length;
        console.log(`CSV with quotes: ${validLines.length}/${nonEmptyLines.length} lines (${(validRatio * 100).toFixed(1)}%) have at least 2 cells`);
        // If at least 50% of lines have 2+ cells, it's likely CSV
        if (validRatio >= 0.5) {
          return true;
        }
        // Get the most common column count to handle inconsistencies
        const columnCounts = parsedLines.map(cols => cols.length);
        const mostCommonColumnCount = columnCounts.sort((a, b) =>
          columnCounts.filter(v => v === a).length - columnCounts.filter(v => v === b).length
        ).pop();

        // Check if most lines have a similar column count (allow ±1 for CSV tables)
        const consistentLines = parsedLines.filter(
          cols => Math.abs(cols.length - mostCommonColumnCount) <= 1
        );

        const consistentRatio = consistentLines.length / parsedLines.length;
        console.log(`CSV consistency with quotes: ${consistentLines.length}/${parsedLines.length} lines (${(consistentRatio * 100).toFixed(1)}%) have consistent column counts, most common count: ${mostCommonColumnCount}`);

        // More lenient threshold (50%) for quoted content and at least 2 columns
        if (consistentRatio >= 0.5 && mostCommonColumnCount >= 2) {
          console.log("Detected as CSV via column consistency with quoted values");
          return true;
        }
      } catch (e) {
        console.error("Error parsing CSV data with quotes:", e);
      }
    } else {
      // For content without quotes, use comma-based checks
      // Basic check: does text contain commas?
      if (!text.includes(',')) return false;

      // Check if this might be just descriptive text with some commas
      // Count lines that are likely CSV rows (have similar comma counts)
      const totalCommaCount = nonEmptyLines.reduce((sum, line) => sum + (line.match(/,/g) || []).length, 0);
      const avgCommasPerLine = totalCommaCount / nonEmptyLines.length;

      // More lenient check for comma frequency - allow as low as 0.7 commas per line on average
      if (avgCommasPerLine < 0.7) {
        console.log("Not likely CSV - too few commas per line on average");
        return false;
      }

      // Parse each line using our CSV parser
      try {
        const parsedLines = nonEmptyLines.map(line => parseCSVLine(line));

        // Get the most common column count to handle slight inconsistencies
        const columnCounts = parsedLines.map(cols => cols.length);
        const mostCommonColumnCount = columnCounts.sort((a, b) =>
          columnCounts.filter(v => v === a).length - columnCounts.filter(v => v === b).length
        ).pop();

        // Check if most lines have a similar column count (allow ±1 for CSV tables)
        const consistentLines = parsedLines.filter(
          cols => Math.abs(cols.length - mostCommonColumnCount) <= 1
        );

        const consistentRatio = consistentLines.length / parsedLines.length;
        console.log(`CSV consistency check: ${consistentLines.length}/${parsedLines.length} lines (${(consistentRatio * 100).toFixed(1)}%) have consistent column counts, most common count: ${mostCommonColumnCount}`);

        // At least 60% of lines should have consistent columns and there should be at least 2 columns
        if (consistentRatio >= 0.6 && mostCommonColumnCount >= 2) {
          console.log("Detected as CSV via column consistency");
          return true;
        }
      } catch (e) {
        console.error("Error parsing CSV data:", e);
      }
    }

    // Finally, check using the isLineTabular to detect if most lines look like CSV
    const tabularLineCount = nonEmptyLines.filter(isLineTabular).length;
    const tabularRatio = tabularLineCount / nonEmptyLines.length;
    console.log(`CSV line-by-line check: ${tabularLineCount}/${nonEmptyLines.length} lines (${(tabularRatio * 100).toFixed(1)}%) are tabular`);

    // Reduced threshold to 50% to be more lenient with mixed content, especially with quoted values
    return tabularRatio >= 0.5;
  };

  // Convert CSV data to markdown table, with support for values that contain spaces
  const formatAsMarkdownTable = (text) => {
    const lines = text.trim().split('\n');

    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    // Function to extract cell content preserving commas inside quotes
    const extractCellsFromLine = (line) => {
      // Fast path for simple cases
      if (!line.includes('"')) {
        return line.split(',').map(cell => cell.trim());
      }
      // Use parseCSVLine for proper handling of quoted values
      return parseCSVLine(line);
    };
    // Single line data should NOT be formatted as a table - requires at least 2 rows
    if (nonEmptyLines.length === 1) {
      console.log("Single line detected - not formatting as table (requires at least 2 rows)");
      return text;
    }
    // For multi-line CSV data
    if (nonEmptyLines.length < 2) return text; // Return original if not enough data

    // Parse each line to extract cells properly
    const rows = nonEmptyLines.map(line => {
      // Extract cells preserving quoted content
      const cells = extractCellsFromLine(line);
      // Clean up and escape cells for markdown table
      return cells.map(cell => {
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

    // Debug logging
    console.log("Processing mixed content input:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
    // Check if this might be an entire CSV table from the first line
    const lines = text.trim().split('\n');
    // Check if any lines contain quoted values that might include commas
    const hasQuotedValues = lines.some(line => /"[^"]*"/.test(line));
    // Special handling for content that looks like a CSV table from the start
    if (lines.length >= 2) {
      if (hasQuotedValues) {
        console.log("Detected quoted values in potential CSV");
        // For CSV with quotes, we need to use our proper CSV parser
        try {
          // Parse the first line to see if it has multiple cells
          const firstLineCells = parseCSVLine(lines[0]);
          if (firstLineCells.length >= 2) {
            // Now try to parse subsequent lines and check consistency
            let validCellsCount = 0;
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim() === '') continue;
              try {
                const cells = parseCSVLine(lines[i]);
                // If this line has roughly the same number of cells as the first line,
                // it's likely part of the same CSV table
                if (Math.abs(cells.length - firstLineCells.length) <= 1 && cells.length >= 2) {
                  validCellsCount++;
                }
              } catch (e) {
                // Skip parsing errors
              }
            }
            const nonEmptyLines = lines.filter(line => line.trim() !== '').length - 1; // Exclude first line
            const validRatio = nonEmptyLines > 0 ? validCellsCount / nonEmptyLines : 0;
            console.log(`CSV with quotes: ${validCellsCount}/${nonEmptyLines} lines (${(validRatio * 100).toFixed(1)}%) match first line cell pattern`);
            // If at least 50% of non-empty lines have a similar cell structure,
            // this is likely a CSV table from the start
            if (validRatio >= 0.5 || validCellsCount >= 2) {
              console.log("Detected CSV table with quotes from the first line");
              return formatAsMarkdownTable(text);
            }
          }
        } catch (e) {
          console.error("Error parsing potential CSV with quotes:", e);
        }
      } else {
        // For regular CSV without quotes, check comma patterns
        const firstLineHasCommas = lines[0].includes(',');
        const commaCount = (lines[0].match(/,/g) || []).length;
        if (firstLineHasCommas && commaCount >= 1) {
          // Count how many lines have similar comma patterns
          const linesWithCommas = lines.filter(line => {
            const lineCommaCount = (line.match(/,/g) || []).length;
            // Allow some variation in comma count (±1)
            return lineCommaCount >= commaCount - 1 && lineCommaCount <= commaCount + 1;
          });
          const csvConsistencyRatio = linesWithCommas.length / lines.length;
          console.log(`CSV consistency from first line: ${linesWithCommas.length}/${lines.length} lines (${(csvConsistencyRatio * 100).toFixed(1)}%) have consistent comma counts`);
          // If at least 60% of lines have consistent comma patterns and there are at least 2 columns,
          // this is likely a CSV table from the start
          if (csvConsistencyRatio >= 0.6 && commaCount >= 1) {
            console.log("Detected CSV table from the first line");
            return formatAsMarkdownTable(text);
          }
        }
      }
    }
    // Single-line input should not be treated as CSV - requires at least 2 rows
    if (!text.includes('\n')) {
      console.log("Single line input detected - not treating as CSV (requires at least 2 rows)");
      return text;
    }

    // Look for mixed content with text followed by a table
    // This will check after each newline to see if the remaining content looks like a CSV table
    for (let i = 0; i < lines.length - 2; i++) {
      // Need at least 2 lines for a table, so don't check near the end
      if (i >= lines.length - 2) break;

      // Get the text before and after this position
      const textPart = lines.slice(0, i + 1).join('\n');
      const tablePart = lines.slice(i + 1).join('\n');

      // Skip if either part is too short
      if (!textPart.trim() || !tablePart.trim()) continue;

      // Check if the table part contains CSV-like data
      const tableLines = tablePart.split('\n').filter(line => line.trim() !== '');
      // Check if there are quoted values in the table part
      const hasQuotedValues = tableLines.some(line => /"[^"]*"/.test(line));
      // For content with quoted values, use our CSV parser instead of simple comma counting
      if (hasQuotedValues) {
        console.log(`Table check at line ${i+1} contains quoted values`);
        try {
          // Check if first line can be parsed as CSV with multiple cells
          const firstLineCells = parseCSVLine(tableLines[0]);
          if (firstLineCells.length >= 2 && tableLines.length >= 2) {
            // Try to parse subsequent lines and count how many match the pattern
            let validLinesCount = 0;
            for (let j = 1; j < tableLines.length; j++) {
              try {
                const cells = parseCSVLine(tableLines[j]);
                if (Math.abs(cells.length - firstLineCells.length) <= 1 && cells.length >= 2) {
                  validLinesCount++;
                }
              } catch (e) {
                // Skip parsing errors
              }
            }
            const validRatio = validLinesCount / (tableLines.length - 1);
            console.log(`CSV with quotes in mixed content: ${validLinesCount}/${tableLines.length - 1} lines (${(validRatio * 100).toFixed(1)}%) match cell pattern`);
            // Also check if the last line of text ends with a colon - this is a stronger indicator
            const endsWithColon = textPart.trim().endsWith(':');
            // For quoted CSV, accept it if either:
            // 1. The text ends with a colon and we have at least one valid line, OR
            // 2. At least 50% of lines match the pattern
            if ((endsWithColon && validLinesCount > 0) || validRatio >= 0.5) {
              console.log(`Detected text followed by CSV table with quotes at line ${i+1}`);
              // Format just the table part as a table
              const formattedTable = formatAsMarkdownTable(tablePart);
              // Return the text part with the formatted table
              return textPart + "\n\n" + formattedTable;
            }
          }
        } catch (e) {
          console.error("Error checking for quoted CSV in mixed content:", e);
        }
      } else {
        // Regular CSV check for content without quotes
        // Check if we have enough CSV-like lines and they contain commas
        const commaLines = tableLines.filter(line => line.includes(','));
        const hasEnoughLines = tableLines.length >= 2;
        const hasEnoughCommas = commaLines.length >= Math.ceil(tableLines.length * 0.4); // At least 40% of lines should have commas

        console.log(`Table check at line ${i+1}: ${hasEnoughLines ? 'has enough lines' : 'not enough lines'}, ${hasEnoughCommas ? 'has enough commas' : 'not enough commas'}, comma lines: ${commaLines.length}/${tableLines.length}`);

        // Also check if the last line of text ends with a colon - this is a stronger indicator
        const endsWithColon = textPart.trim().endsWith(':');

        // The best boundary would be text ending with a colon, but we'll accept other boundaries too
        if (hasEnoughLines && hasEnoughCommas && (endsWithColon || commaLines.length >= 3)) {
          console.log(`Detected text followed by table data at line ${i+1}${endsWithColon ? ' (ends with colon)' : ''}`);

          // Format just the table part as a table
          const formattedTable = formatAsMarkdownTable(tablePart);

          // Return the text part with the formatted table
          return textPart + "\n\n" + formattedTable;
        }
      }
    }

    // If the colon pattern didn't match or wasn't valid CSV, proceed with normal detection

    // First check: If it's a simple all-table content, process it directly
    if (isTabularData(text)) {
      console.log("Detected as complete tabular data");
      return formatAsMarkdownTable(text);
    }

    // For mixed content, identify the sections
    const sections = identifyTabularSections(text);
    console.log("Found sections:", sections.length);

    // If no mixed content is detected, return the original text
    if (sections.length <= 1) {
      // Special case: if we have exactly one section and it's a table section
      if (sections.length === 1 && sections[0].type === 'table') {
        const tableText = sections[0].lines.join('\n');
        console.log("Processing single table section:", tableText.substring(0, 50) + (tableText.length > 50 ? "..." : ""));
        return formatAsMarkdownTable(tableText);
      }
      console.log("Not detected as mixed content");
      return text;
    }

    // Check if any section is identified as a table
    const hasTableSection = sections.some(section => section.type === 'table');
    if (!hasTableSection) {
      console.log("No valid table sections found");
      return text;
    }

    // Process each section
    const processedText = sections.map(section => {
      if (section.type === 'table') {
        const tableText = section.lines.join('\n');
        console.log("Processing table section:", tableText.substring(0, 50) + (tableText.length > 50 ? "..." : ""));

        // For single-line tables, we've already validated them during section identification
        if (section.lines.length === 1) {
          console.log("Converting single-line table section to markdown table");
          return formatAsMarkdownTable(tableText);
        }
        // For multi-line tables, do an extra validation
        if (section.lines.length >= 2 && isTabularData(tableText)) {
          console.log("Converting multi-line table section to markdown table");
          return formatAsMarkdownTable(tableText);
        } else {
          console.log("Section failed tabular validation, keeping as text");
          return tableText;
        }
      } else {
        // For text sections, just join the lines back
        return section.lines.join('\n');
      }
    }).join('\n\n');

    console.log("Processed mixed content result:", processedText.substring(0, 50) + (processedText.length > 50 ? "..." : ""));
    return processedText;
  };

  // Handle sending a new message
  const handleMessage = useCallback(async (userMessage, botResponse = null) => {
    console.log("Handling message, bot response:", botResponse ? botResponse.type : "none");

    // If there's no bot response yet, this is the initial message from the user
    if (!botResponse) {
      console.log("Processing initial user message:", userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""));
      // Check if the message starts with a code block
      const isCodeBlock = userMessage.trim().startsWith("```") && userMessage.trim().includes("```", 3);
      // Skip CSV processing for code blocks as they should be preserved as-is
      let processedUserMessage;
      if (isCodeBlock) {
        processedUserMessage = userMessage;
      } else {
        // Process message to handle mixed content and format tables
        processedUserMessage = processMixedContent(userMessage);
      }

      // Add user message to the chat in chronological order (at the end)
      setHelp(prev => [
        ...prev,
        {
          user: processedUserMessage,
          help: getHelp(processedUserMessage),
          type: 'user'
        }
      ]);

      return;
    }

    // If we have a bot response but need to skip adding user message (to avoid duplication)
    const skipUserMessage = botResponse.skipUserMessage;

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

  // Custom dropzone component for CSV uploads
  const CsvDropzone = () => {
    const onDrop = useCallback((acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      console.log("Uploaded file:", file.name);

      // Read the file contents
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;
        let updateSuccess = false;

        // Wait a moment to ensure the editor is accessible
        setTimeout(() => {
          // Try direct DOM manipulation first - most reliable method
          try {
            // Try to find the editor in multiple ways
            const editorElement =
              document.querySelector("[contenteditable=true]") ||
              document.querySelector(".ProseMirror") ||
              document.querySelector("[role='textbox']");

            if (editorElement) {
              console.log("Found editor element:", editorElement);
              // Focus and clear the editor
              editorElement.focus();

              // Try multiple approaches to insert text
              try {
                // Modern approach
                document.execCommand('selectAll', false, null);
                document.execCommand('delete', false, null);
                document.execCommand('insertText', false, fileContent);
                updateSuccess = true;
                console.log("Successfully inserted content via execCommand");
              } catch (insertErr) {
                console.error("execCommand insertion failed:", insertErr);

                // Try direct innerHTML approach
                try {
                  editorElement.innerHTML = '';
                  editorElement.innerHTML = fileContent.replace(/\n/g, '<br>');
                  updateSuccess = true;
                  console.log("Successfully inserted content via innerHTML");
                } catch (innerErr) {
                  console.error("innerHTML insertion failed:", innerErr);
                }
              }
            } else {
              console.error("Could not find editor element");
            }
          } catch (err) {
            console.error("DOM manipulation failed:", err);
          }

          // If direct DOM manipulation failed, try state update
          if (!updateSuccess && state && typeof state.update === 'function') {
            try {
              state.update({
                type: 'csv-upload',
                args: {
                  content: fileContent
                }
              });
              updateSuccess = true;
              console.log("Successfully updated content via state update");
            } catch (err) {
              console.error("State update failed:", err);
            }
          }

          // Show appropriate notification
          if (updateSuccess) {
            setUploadNotification({
              type: 'success',
              message: `File "${file.name}" loaded into editor`,
              fileName: file.name
            });
          } else {
            // Last resort: copy to clipboard
            try {
              // First try the modern clipboard API
              navigator.clipboard.writeText(fileContent)
                .then(() => {
                  setUploadNotification({
                    type: 'warning',
                    message: `File content copied to clipboard. Press Ctrl+V or Cmd+V to paste.`,
                    fileName: file.name
                  });
                })
                .catch((clipErr) => {
                  console.error("Clipboard API failed:", clipErr);
                  // Fallback: show error notification
                  setUploadNotification({
                    type: 'error',
                    message: `Could not process file. Please try copying and pasting manually.`,
                    fileName: file.name
                  });
                });
            } catch (clipErr) {
              console.error("Clipboard operation failed:", clipErr);
              setUploadNotification({
                type: 'error',
                message: `Could not process file`,
                fileName: file.name
              });
            }
          }

          // Close the modal
          setShowUploadModal(false);

          // Clear notification after 3 seconds
          setTimeout(() => {
            setUploadNotification(null);
          }, 3000);
        }, 100); // Small delay to ensure DOM is ready
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setUploadNotification({
          type: 'error',
          message: 'Error reading file',
          fileName: file.name
        });

        // Close the modal
        setShowUploadModal(false);

        // Clear notification after 3 seconds
        setTimeout(() => {
          setUploadNotification(null);
        }, 3000);
      };

      // Read the file as text
      reader.readAsText(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'text/*': ['.txt', '.csv', '.json', '.xml', '.md', '.log', '.conf', '.cfg', '.ini', '.yaml', '.yml', '.toml', '.gc'],
        'application/json': ['.json'],
        'application/xml': ['.xml'],
        'application/x-yaml': ['.yaml', '.yml'],
        'application/toml': ['.toml'],
        'text/plain': ['.txt', '.text', '.log', '.gc'],
        'text/csv': ['.csv'],
        'text/markdown': ['.md', '.markdown'],
        'text/x-python': ['.py'],
        'text/x-java': ['.java'],
        'text/javascript': ['.js', '.mjs', '.jsx'],
        'text/typescript': ['.ts', '.tsx'],
        'text/x-c': ['.c', '.h'],
        'text/x-c++': ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'],
        'text/x-ruby': ['.rb'],
        'text/x-go': ['.go'],
        'text/x-rust': ['.rs'],
        'text/html': ['.html', '.htm'],
        'text/css': ['.css', '.scss', '.sass'],
        'application/x-sh': ['.sh', '.bash'],
        'text/x-sql': ['.sql']
      },
      maxFiles: 1
    });

    const modalContent = (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          position: 'fixed',
          zIndex: 2147483647, // Max possible z-index value
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setShowUploadModal(false)}
      >
        <div
          className="bg-white rounded-md p-4 shadow-xl w-[400px] max-w-[90vw]"
          style={{
            position: 'relative',
            zIndex: 2147483647,
            backgroundColor: 'white',
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium">Upload Text File</h3>
            <button
              onClick={() => setShowUploadModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            {...getRootProps()}
            className={`border border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{
              border: '1px dashed',
              borderColor: isDragActive ? '#3b82f6' : '#d1d5db',
              borderRadius: '0.375rem',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? '#eff6ff' : 'transparent'
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-500 text-sm">Drop the text file here...</p>
            ) : (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drag & drop a text file here, or <span className="text-blue-500 font-medium">click to select</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Text files (.txt, .csv, .json, .py, .js, .md, .gc, etc.)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.25rem',
                transition: 'background-color 0.2s'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

    // Render the modal content as a portal to the document body
    return createPortal(
      modalContent,
      document.body
    );
  };

  // Handle CSV file upload (legacy method for direct input handling)
  const handleCsvUpload = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    try {
      const file = event.target.files[0];
      console.log("Uploaded file:", file.name);
      // Read the file contents
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;
        let updateSuccess = false;
        // Try direct DOM manipulation first - most reliable method
        try {
          const editorElement = document.querySelector("[contenteditable=true]");
          if (editorElement) {
            // Focus and clear the editor
            editorElement.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
            // Insert the content
            document.execCommand('insertText', false, fileContent);
            updateSuccess = true;
            console.log("Successfully inserted content via contenteditable element");
          }
        } catch (err) {
          console.error("DOM manipulation failed:", err);
        }
        // Try state update as a fallback
        if (!updateSuccess && state && typeof state.apply === 'function') {
          try {
            state.apply({
              type: 'csv-upload',
              args: {
                content: fileContent
              }
            });
            updateSuccess = true;
            console.log("Successfully updated content via state update");
          } catch (err) {
            console.error("State update failed:", err);
          }
        }
        // Show appropriate notification
        if (updateSuccess) {
          setUploadNotification({
            type: 'success',
            message: `File "${file.name}" loaded into editor`,
            fileName: file.name
          });
        } else {
          // Last resort: copy to clipboard
          navigator.clipboard.writeText(fileContent)
            .then(() => {
              setUploadNotification({
                type: 'warning',
                message: `File content copied to clipboard. Press Ctrl+V or Cmd+V to paste.`,
                fileName: file.name
              });
            })
            .catch(() => {
              setUploadNotification({
                type: 'error',
                message: `Could not process file`,
                fileName: file.name
              });
            });
        }
        // Clear notification after 3 seconds
        setTimeout(() => {
          setUploadNotification(null);
        }, 3000);
        // Clear the file input
        event.target.value = null;
      };
      reader.onerror = () => {
        console.error("Error reading file");
        // Show error notification
        setUploadNotification({
          type: 'error',
          message: 'Error reading file',
          fileName: file.name
        });
        // Clear notification after 3 seconds
        setTimeout(() => {
          setUploadNotification(null);
        }, 3000);
        // Clear the file input
        event.target.value = null;
      };
      // Read the file as text
      reader.readAsText(file);
    } catch (error) {
      console.error("Error handling CSV upload:", error);
      // Show error notification
      setUploadNotification({
        type: 'error',
        message: 'Error uploading file',
        fileName: event.target.files?.[0]?.name || 'Unknown file'
      });
      // Clear notification after 3 seconds
      setTimeout(() => {
        setUploadNotification(null);
      }, 3000);
    }
  };

  // Re-create ChatBot when help (chat history) changes
  // This ensures that new messages are included in the context
  useEffect(() => {
    console.log("Chat history updated, messages count:", help.length);
  }, [help]);

  // Update state handler after ChatBot is initialized
  useEffect(() => {
    if (handleSendMessage && state) {
      stateRef.current = state;
      // Now we can update the state to properly handle messages
      state.apply({
        type: 'config',
        args: {
          handleSendMessage,
          isLoading
        }
      });
    }
  }, [handleSendMessage, isLoading, state]);

  // Function to format token usage display
  const formatTokenUsage = (usage) => {
    if (!usage) return "";
    return `Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens}`;
  };

  // Function to handle deleting a message
  const handleDeleteMessagePair = (index) => {
    // Check if this is a pending message
    const isPendingMessage = isLoading &&
                            help[index].type === 'user' &&
                            (index === help.length - 1 || help[index + 1]?.type !== 'bot');

    // If this is a pending message, cancel code generation first
    if (isPendingMessage) {
      console.log('Cancelling code generation for pending message');
      cancelGeneration();

      // Clear the timer if it's running
      if (processingTimeRef.current) {
        clearInterval(processingTimeRef.current);
        processingTimeRef.current = null;
      }
    }

    // Update help array to remove the message(s)
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

  // Create refs and state for UI elements
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(130);  // Default initial height
  const [processingTime, setProcessingTime] = useState(0);
  const processingTimeRef = useRef(null);

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

    // Track processing time when isLoading changes
    if (isLoading) {
      // Reset the time and start the timer
      setProcessingTime(0);
      processingTimeRef.current = setInterval(() => {
        setProcessingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      // Clear the timer when loading is done
      if (processingTimeRef.current) {
        clearInterval(processingTimeRef.current);
        processingTimeRef.current = null;
      }
    }

    // Clean up on unmount
    return () => {
      if (processingTimeRef.current) {
        clearInterval(processingTimeRef.current);
      }
    };
  }, [isLoading]);

  // Function to prepare messages for display
  const prepareMessagesForDisplay = () => {
    // Find all user messages in reverse chronological order (newest to oldest)
    const userMessages = help
      .filter(item => item.type === 'user')
      .map((msg, idx) => ({
        ...msg,
        index: help.indexOf(msg)
      }))
      .reverse(); // Reverse to show newest messages first

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
    <div {...getRootProps()} className={`flex flex-col h-[calc(100vh-120px)] ${isDragActive ? 'drag-active' : ''}`}>
      {/* Add style tag for dropzone styles */}
      <style>{dropzoneStyles}</style>

      <input {...getInputProps()} />

      {/* Drag overlay - only visible when dragging */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center z-50 border-4 border-dashed border-blue-400 rounded-lg">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-lg font-semibold text-blue-700">Drop text file here</p>
          </div>
        </div>
      )}

      {/* Input field at the top */}
      <div ref={headerRef} className="flex-none sticky top-0 z-20 bg-white px-4 py-3 border-b shadow-md">
        <div className="flex justify-between items-center text-xs mb-2">
          <div className="font-light text-gray-500">
            <span className="font-medium border py-0.5 px-1 rounded-sm bg-[#f8f8f8]">Shift+Enter</span> for newlines, {' '}
            <span className="font-medium py-0.5">CSV</span> for tables, {' '}
            <span className="font-medium py-0.5 px-1 rounded-sm bg-[#f8f8f8] font-mono">```</span> for code.
            Drag & drop to
            <span title="Drag & drop to upload file" className="mx-1 text-blue-500 flex items-center inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            file.{' '}
            <span className="font-medium border py-0.5 px-1 rounded-sm bg-[#f8f8f8]">Enter</span> to send.
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-1 pb-0">
            <TextEditor
              key={help.length === 0 ? 'empty' : 'has-content'}
              state={state}
              disabled={isLoading}
              placeholder={help.length > 0 ? "Reply to make changes..." : "What do you want to make today?"}
            />
          </div>
        </div>
        {/* File Upload Notification */}
        {uploadNotification && (
          <div className={`absolute left-1/2 transform -translate-x-1/2 top-24 px-4 py-2 rounded-md shadow-md z-50 flex items-center text-sm ${
            uploadNotification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="mr-2">
              {uploadNotification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              {uploadNotification.message}
            </div>
          </div>
        )}

        {/* File Upload Modal */}
        {showUploadModal && <CsvDropzone />}
      </div>

      {/* Scrollable messages container - now takes most of the space */}
      <div
        className="flex-grow overflow-auto px-4 py-4"
        style={{
          height: 'calc(100vh - 240px)' // Adjusted to account for input at top
        }}
      >
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
                  <div className="mx-4 text-xs text-gray-500">Requests (Latest First)</div>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              )}

              {/* User messages in reverse chronological order, newest first */}
              <div className="space-y-2">
                {userMessages
                  // Displaying messages in reverse chronological order (newest first)
                  .map((message, index) => {
                    // Check if this message is pending (waiting for a response)
                    // We use the same logic as in handleDeleteMessagePair for consistency
                    const isPending = isLoading &&
                                     (message.index === help.length - 1 ||
                                      help[message.index + 1]?.type !== 'bot');

                    return (
                      <div key={index} className="mb-2 relative group w-full">
                        {/* Delete button for each user message - highlighted for pending messages but only visible on hover */}
                        <button
                          className={`absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 z-10 ${isPending ? 'text-red-400 hover:text-red-600 bg-white rounded-full shadow-sm' : 'text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm'}`}
                          onClick={() => handleDeleteMessagePair(message.index)}
                          title={isPending ? "Cancel and delete request" : "Delete message"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>


                        <div className={`bg-blue-100 rounded-lg p-3 overflow-hidden ${isPending ? 'border-2 border-blue-300' : ''}`}>
                          {isPending && (
                            <div className="flex items-center justify-start mb-2 text-xs text-blue-600 font-medium">
                              <div className="text-blue-500 mr-2 text-sm flex items-center">
                                {`${processingTime}s`}
                              </div>
                              <div className="flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}></div>
                              </div>
                            </div>
                          )}
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
                  );
                })}
              </div>

            </>
          );
        })()}
      </div>
    </div>
  );
};
