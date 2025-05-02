import { getFirestore } from '../../utils/db';
import { verifyIdToken } from '../../utils/auth';

const handler = async (req, res) => {
  // Only allow POST method
  if (req.method !== 'POST') {
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

    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const db = getFirestore();
    
    // Check if the invite code exists and is valid
    const inviteCodesRef = db.collection('inviteCodes');
    const snapshot = await inviteCodesRef.where('code', '==', inviteCode).where('used', '==', false).get();
    
    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid or already used invite code' });
    }

    // Mark the invite code as used
    const inviteCodeDoc = snapshot.docs[0];
    await inviteCodeDoc.ref.update({
      used: true,
      usedBy: uid,
      usedAt: new Date().toISOString()
    });

    // Mark the user as verified
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('uid', '==', uid).get();
    
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        isVerified: true,
        inviteCode: inviteCode,
        verifiedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({ message: 'Invite code validated successfully' });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;