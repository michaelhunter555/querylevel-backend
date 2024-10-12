import { Request, Response } from "express";
import Stripe from "stripe";

import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

export default async function (req: Request, res: Response) {
  const { id, prevPlan } = req.query;
  const { selectedPlan, selectedPricePlan } = req.body;

  //FOR TESTING use => process.env.STRIPE_TEST_SECRET_KEY
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
  });

  const user = await findGoogleAuthById(id as string, res);

  if (!user.stripeCustomerId) {
    const createCustomer = await stripe.customers.create({
      email: user?.email,
      name: user?.name,
    });
    user.stripeCustomerId = createCustomer.id;
    await user.save();
  }

  if (user?.stripeCustomerId) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: selectedPricePlan, quantity: 1 }],
        mode: "subscription",
        customer: user.stripeCustomerId,
        success_url: `${req.headers.origin}/manage-subscription`,
        cancel_url: `${req.headers.origin}/manage-subscription`,
        metadata: {
          userId: user?._id.toString(),
          planType: selectedPlan,
          oldPlanType: prevPlan as string,
          oldQuantity: user?.campaignQuota,
        },
        ...(user?.planType === "free"
          ? {
              discounts: [
                {
                  //TEST MODE: oakFBGmh
                  //LIVE: yb1mgiit
                  coupon: "yb1mgiit",
                },
              ],
            }
          : {}),
      });
      res.status(200).json({
        ok: true,
        sessionId: session?.id,
        url: session?.url,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ err });
    }
  } else {
    console.log("No stripe customerId was created.");
    return res
      .status(404)
      .json({ message: "no stripe customerId found or created." });
  }
}
