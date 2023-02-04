import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

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
