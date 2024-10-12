import { Request, Response } from "express";
import Stripe from "stripe";

import GoogleAdsAuth from "../../models/GoogleAdsAuth";

//FOR TESTING use => process.env.STRIPE_TEST_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { subscriptionId } = req.body;

  const user = await GoogleAdsAuth.findById(id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const subscription = await stripe.subscriptions.cancel(
      String(subscriptionId),
      {
        invoice_now: false,
        prorate: false,
      }
    );
    if (subscription.status === "canceled") {
      res.status(200).json({
        ok: true,
        message: "Your subscription has been successfully cancelled. ",
        planType: "canceled",
      });
    } else {
      return res.status(404).json({
        ok: true,
        message:
          "Unable to cancel subscription. Either the subscription no longer exists or this action was unauthorized.",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      ok: false,
      message:
        "An error has occurred while attempting to cancel. Please try again in a few seconds and contact us if this issue continues.",
    });
  }
}
