import { Request, Response } from "express";
import Stripe from "stripe";

import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { newPriceId, newPlanName } = req.body;

  //FOR TESTING use => process.env.STRIPE_TEST_SECRET_KEY
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
  });

  const user = await findGoogleAuthById(id as string, res);

  if (!user?.stripeCustomerId) {
    return res.status(404).json({
      message:
        "User's Stripe customerId  not found. You may need to select a plan first.",
    }); //should not be able to update if a plan hasn't been selected
  }

  if (user?.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        user?.stripeSubscriptionId
      );
      await stripe.subscriptions.update(String(user?.stripeSubscriptionId), {
        items: [
          {
            id: subscription?.items?.data[0]?.id,
            price: newPriceId,
            quantity: 1,
          },
        ],
        metadata: {
          planType: newPlanName,
        },
      });
      res.status(200).json({
        message: "Subscription updated successfully",
        ok: true,
        planType: newPlanName,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message:
          "Error updating subscription. Please try again or contact support",
      });
    }
  }
}
