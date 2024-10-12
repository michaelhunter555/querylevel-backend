import { Request, Response } from "express";
import Stripe from "stripe";

import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { quantity } = req.body;

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
  //TEST: "price_1PSD6MP3CMhEecSy5kwmRGfj"
  //LIVE: "price_1PtyD7P3CMhEecSyNoIzVGRS"
  const singleTierPurchase = "price_1PtyD7P3CMhEecSyNoIzVGRS";
  const firstTimeCoupon = "LVty7cpN"; //buy 2 get 2 free

  if (user?.stripeCustomerId) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: singleTierPurchase, quantity: quantity }],
        mode: "payment",
        customer: user.stripeCustomerId,
        success_url: `${req.headers.origin}/manage-subscription`,
        cancel_url: `${req.headers.origin}/manage-subscription`,
        metadata: {
          userId: user?._id.toString(),
          planType: "payAsYouGo",
          quantity: quantity,
        },
        ...(user?.planType === "free" && quantity >= 4
          ? {
              discounts: [{ coupon: firstTimeCoupon }],
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
