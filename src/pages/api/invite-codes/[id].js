import { getFirestore } from '../../../utils/db';
import { verifyIdToken } from '../../../utils/auth';

// Helper to check if user is admin
async function isAdmin(uid) {
  const db = getFirestore();
  const usersRef = db.collection('users');
  const userQuery = await usersRef.where('uid', '==', uid).get();
  
  if (userQuery.empty) {
    return false;
  }
  
  const userData = userQuery.docs[0].data();
  return userData.isAdmin === true;
}

const handler = async (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Invite code ID is required' });
  }

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

  // Check if user is an admin
  if (!(await isAdmin(uid))) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  const db = getFirestore();
  const inviteCodesRef = db.collection('inviteCodes');

  // GET: Get a specific invite code
  if (req.method === 'GET') {
    try {
      const doc = await inviteCodesRef.doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ message: 'Invite code not found' });
      }
      
      return res.status(200).json({ 
        id: doc.id, 
        ...doc.data() 
      });
    } catch (error) {
      console.error('Error fetching invite code:', error);
      return res.status(500).json({ message: 'Failed to fetch invite code' });
    }
  }
  
  // DELETE: Delete an invite code
  if (req.method === 'DELETE') {
    try {
      const doc = await inviteCodesRef.doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ message: 'Invite code not found' });
      }

      // Check if the code is already used
      const data = doc.data();
      if (data.used) {
        return res.status(400).json({ message: 'Cannot delete an already used invite code' });
      }
      
      await inviteCodesRef.doc(id).delete();
      
      return res.status(200).json({ message: 'Invite code deleted successfully' });
    } catch (error) {
      console.error('Error deleting invite code:', error);
      return res.status(500).json({ message: 'Failed to delete invite code' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
};

export default handler;