import { getFirestore } from '../../../utils/db';
import { verifyIdToken } from '../../../utils/auth';

const handler = async (req, res) => {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the user is authenticated
    let uid;
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const decodedToken = await verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Invalid authorization token' });
    }

    const db = getFirestore();
    
    // Check if user exists in the database
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('uid', '==', uid).get();
    
    if (userQuery.empty) {
      return res.status(200).json({ isAdmin: false });
    }

    const userData = userQuery.docs[0].data();
    
    return res.status(200).json({
      isAdmin: userData.isAdmin === true
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;