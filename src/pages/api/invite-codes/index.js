import { getFirestore } from '../../../utils/db';
import { verifyIdToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate a random 8-character code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

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

  // GET: List all invite codes
  if (req.method === 'GET') {
    try {
      const snapshot = await inviteCodesRef.orderBy('createdAt', 'desc').get();
      const inviteCodes = [];
      
      snapshot.forEach((doc) => {
        inviteCodes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json({ inviteCodes });
    } catch (error) {
      console.error('Error fetching invite codes:', error);
      return res.status(500).json({ message: 'Failed to fetch invite codes' });
    }
  }
  
  // POST: Create a new invite code
  if (req.method === 'POST') {
    try {
      const { code } = req.body;
      const inviteCode = code || generateRandomCode();
      
      // Check if the code already exists
      const existingCode = await inviteCodesRef.where('code', '==', inviteCode).get();
      if (!existingCode.empty) {
        return res.status(400).json({ message: 'Invite code already exists' });
      }
      
      const newInviteCode = {
        id: uuidv4(),
        code: inviteCode,
        createdBy: uid,
        createdAt: new Date().toISOString(),
        used: false
      };
      
      await inviteCodesRef.doc(newInviteCode.id).set(newInviteCode);
      
      return res.status(201).json({ inviteCode: newInviteCode });
    } catch (error) {
      console.error('Error creating invite code:', error);
      return res.status(500).json({ message: 'Failed to create invite code' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
};

export default handler;