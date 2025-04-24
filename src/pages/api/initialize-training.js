import { initializeTrainingExamples } from '../../lib/code-generation-service';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check authentication (optional - you might want to restrict this to admins)
    // For demo purposes, we're not implementing auth checks

    // Get language code from request body if provided
    const { language } = req.body;

    // If language is provided in 'LXXXX' format, extract just the number part
    let targetLang = null;
    if (language) {
      // Extract the language code (e.g., "0002" from "L0002")
      targetLang = language.startsWith('L')
        ? language.substring(1)
        : language;

      console.log(`Initializing training examples for language: ${targetLang}`);
    } else {
      console.log('Initializing training examples for all languages');
    }

    // Initialize the training examples for the specific language or all languages
    const result = await initializeTrainingExamples(targetLang);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error initializing training data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize training data',
      error: error.message
    });
  }
}