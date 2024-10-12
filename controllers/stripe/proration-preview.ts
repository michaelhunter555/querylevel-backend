import { Request, Response } from "express";
import Stripe from "stripe";

//FOR TESTING use => process.env.STRIPE_TEST_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function (req: Request, res: Response) {
  const { pricePreview, stripeCustomerId, stripeSubscriptionId } = req.query;

  const prorateDate = Math.floor(new Date().getTime() / 1000);

  if (stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        String(stripeSubscriptionId as string)
      );

      if (subscription.status !== "active") {
        return res
          .status(400)
          .json({ message: "No preview, Subscription has been canceled" });
      }

      const items = [
        {
          id: subscription.items.data[0].id,
          price: String(pricePreview as string),
        },
      ];

      const previewInvoice = await stripe.invoices.retrieveUpcoming({
        customer: stripeCustomerId as string,
        subscription: stripeSubscriptionId as string,
        subscription_items: items,
        subscription_proration_date: prorateDate,
        //  subscription_proration_behavior: "always_invoice",
      });

      res.status(200).json({ invoicePreview: previewInvoice });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err });
    }
  } else {
    return res.status(404).json({
      message: "Unable to find user with current subscription Id.",
    });
  }
}
