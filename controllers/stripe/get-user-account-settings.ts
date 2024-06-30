import { Request, Response } from "express";
import Stripe from "stripe";

import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  let user = await findGoogleAuthById(id as string, res);

  let currentInvoice: number = 0;

  if (user?.stripeSubscriptionId && user?.planType !== "canceled") {
    const userSub = await stripe.subscriptions.list({
      customer: user?.stripeCustomerId,
    });

    if (userSub.data.at(0)?.id) {
      const invoice = await stripe.invoices.retrieveUpcoming({
        subscription: userSub.data.at(0)?.id,
      });
      currentInvoice = invoice.amount_due;
    }
  }

  if (!user.planType) {
    user.planType = "free";
    await user.save();
  }

  if (!user.cleanUpService && user.planType === "free") {
    user.cleanUpService = false;
    await user.save();
  }

  const userSettings = {
    userId: user?._id,
    lastBillingDate: user?.startPlan,
    nextBillingDate: user.planExpiryDate,
    name: user?.name,
    cleanUpService: user.cleanUpService,
    totalCampaignsCreated: user?.createdCampaigns,
    planType: user?.planType,
    stripeCustomerId: user?.stripeCustomerId,
    stripeSubscriptionId: user?.stripeSubscriptionId,
    accountActive: user?.accountActive,
    campaignQuota: user?.campaignQuota,
    totalCreatedCampaigns: user?.totalCreatedCampaigns,
  };

  try {
    res.status(200).json({
      user: userSettings,
      ok: true,
      amountDue: currentInvoice,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "error in retreiving user data", ok: false });
  }
}
