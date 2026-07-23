import { getFirestore } from '../../utils/db';
import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '../../lib/plans-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: STRIPE_API_VERSION,
});

const handler = async (req, res) => {
  console.log("GET /secret");
  const db = getFirestore();
  const { id } = req.query;
  const client = await db.doc(`users/${id}`).get();
  const { stripeCustomer } = client.data();
  const stripeSetupIntent = await stripe.setupIntents.create({
    customer: stripeCustomer.id,
    payment_method_types: ['card'],
  });
  const stripeClientSecret = stripeSetupIntent.client_secret;
  res.json({ client_secret: stripeClientSecret });
};

export default handler;
