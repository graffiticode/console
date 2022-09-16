import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});
const customer = await stripe.customers.create();
console.log("customer=" + JSON.stringify(customer, null, 2));
const setupIntent = await stripe.setupIntents.create({
  customer: customer.id,
});


const handler = async (req, res) => {
  const intent = setupIntent;
  res.json({client_secret: intent.client_secret});
};

export default handler;
