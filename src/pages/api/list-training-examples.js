import admin from 'firebase-admin';

// Get Firestore database reference with initialization check
function getFirestoreDb() {
  // Get existing Firestore instance or initialize if needed
  try {
    return admin.firestore();
  } catch (error) {
    // If admin isn't initialized, initialize it with our project
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'graffiticode'
      });
    }
    return admin.firestore();
  }
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { language, limit = 10, offset = 0 } = req.query;

    const db = getFirestoreDb();
    const trainingCollRef = db.collection('training_examples');

    // Build query
    let query = trainingCollRef;

    // Filter by language if provided
    if (language) {
      // Extract language code (e.g., "0002" from "L0002")
      const langCode = language.startsWith('L')
        ? language.substring(1)
        : language;

      query = query.where('lang', '==', langCode);
    }

    // Apply pagination
    query = query.orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Execute query
    const snapshot = await query.get();

    // Process results
    const examples = [];
    snapshot.forEach(doc => {
      examples.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: doc.data().createdAt?.toDate().toISOString() || null
      });
    });

    // Get total count (for pagination)
    let totalCount = 0;
    if (language) {
      const langCode = language.startsWith('L') ? language.substring(1) : language;
      const countSnapshot = await trainingCollRef.where('lang', '==', langCode).count().get();
      totalCount = countSnapshot.data().count;
    } else {
      const countSnapshot = await trainingCollRef.count().get();
      totalCount = countSnapshot.data().count;
    }

    return res.status(200).json({
      success: true,
      data: {
        examples,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: examples.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving training examples:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve training examples',
      error: error.message
    });
  }
}