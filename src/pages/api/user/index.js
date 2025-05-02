import { getFirestore } from '../../../utils/db';
import Stripe from 'stripe';
import { verifyIdToken } from '../../../utils/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

const handler = async (req, res) => {
  try {
    const db = getFirestore();
    
    // For GET requests, verify token and return user data
    if (req.method === 'GET') {
      try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        const decodedToken = await verifyIdToken(token);
        const uid = decodedToken.uid;
        
        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('uid', '==', uid).get();
        
        if (userQuery.empty) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const userData = userQuery.docs[0].data();
        return res.status(200).json({ 
          id: userQuery.docs[0].id,
          ...userData,
          isVerified: userData.isVerified || false
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
    
    // For POST requests, create or get a user
    if (req.method === 'POST') {
      const { name, email, uid } = req.body;
      
      if (!uid) {
        return res.status(400).json({ message: 'User UID is required' });
      }
      
      // Check if user exists
      const usersRef = db.collection('users');
      const userQuery = await usersRef.where('uid', '==', uid).get();
      
      if (!userQuery.empty) {
        // User already exists, return it
        const userData = userQuery.docs[0].data();
        console.info("*POST /user id=" + userQuery.docs[0].id);
        return res.status(200).json({ 
          id: userQuery.docs[0].id,
          ...userData
        });
      }
      
      // Otherwise, create a new user
      // const stripeCustomer = await stripe.customers.create({
      //   name,
      //   email,
      // });
      
      const userData = {
        ...req.body,
        created: new Date().toISOString(),
        isVerified: false, // New users need verification via invite code
        // stripeCustomer,
      };
      
      const docRef = await db.collection('users').add(userData);
      const id = docRef.id;
      
      console.info("*POST /user new user created, id=" + id);
      return res.status(201).json({ 
        id,
        ...userData
      });
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (e) {
    console.error("POST /user error=", e);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;