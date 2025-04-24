import { addTrainingExample } from '../../lib/code-generation-service';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { description, code, explanation, expected_output, language } = req.body;

    // Validate required fields
    if (!description || !code || !explanation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please provide description, code, and explanation.'
      });
    }

    // Process language parameter if provided
    let lang = "0002"; // Default to L0002
    if (language) {
      // Extract language code (e.g., "0002" from "L0002")
      lang = language.startsWith('L')
        ? language.substring(1)
        : language;
    }

    // Add the example to the database
    const result = await addTrainingExample({
      description,
      code,
      explanation,
      expected_output,
      lang, // Include language code
      // Add any additional metadata if needed
      added_at: new Date().toISOString()
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error adding training example:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add training example',
      error: error.message
    });
  }
}