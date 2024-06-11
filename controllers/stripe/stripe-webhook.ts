import { Request, Response } from "express";
import Stripe from "stripe";

import GoogleAdsAuth from "../../models/GoogleAdsAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export default async function (req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      String(process.env.STRIPE_WEBHOOK_SECRET)
    );

    //console.log("IM LOOPING...");
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await GoogleAdsAuth.findOne({
            stripeCustomerId: String(subscription.customer),
          });

          if (user) {
            user.startPlan = new Date(subscription.current_period_start * 1000);
            user.planExpiryDate = new Date(
              subscription.current_period_end * 1000
            );
            user.accountActive = true;
            user.stripeSubscriptionId = subscription.id;
            if (subscription?.metadata?.planType) {
              user.planType = subscription.metadata.planType;
              user.campaignQuota =
                subscription?.metadata?.planType === "growing" ? 10 : 25; //campaignQuota
            }
            try {
              await user.save();
            } catch (err) {
              console.log("error saving user", err);
            }
          }
        }

        break;
      case "customer.subscription.deleted":
        {
          const deleteCustomer = event.data.object as Stripe.Subscription;
          const user = await GoogleAdsAuth.findOne({
            stripeCustomerId: deleteCustomer.customer,
          });

          if (user) {
            user.accountActive = false;
            user.cleanUpService = false;
            user.campaignQuota = 0;
            user.planType = "canceled";
            await user.save();
          }
        }
        break;
      case "checkout.session.completed":
        {
          const session = event.data.object as Stripe.Checkout.Session;

          const user = await GoogleAdsAuth.findOne({
            stripeCustomerId: String(session?.customer),
          });

          if (session.subscription && session.payment_status === "paid") {
            const subscription = await stripe.subscriptions.retrieve(
              session?.subscription as string
            );

            const startPeriod = new Date(
              subscription?.current_period_start * 1000
            );
            const endPeriod = new Date(subscription?.current_period_end * 1000);

            await GoogleAdsAuth.findOne({
              stripeCustomerId: String(session.customer),
            });

            if (user) {
              user.planType = session?.metadata?.planType;
              user.accountActive = true;

              user.startPlan = startPeriod;
              user.stripeSubscriptionId = String(session.subscription);
              user.planExpiryDate = endPeriod;

              if (session?.metadata?.planType === "pro") {
                user.campaignQuota = 25;
                user.cleanUpService = true;
              } else if (session?.metadata?.planType === "growing") {
                user.campaignQuota = 10;
              }
              await user.save();
            }
          }
        }
        break;
      case "invoice.payment_succeeded":
        {
          const invoice = event.data.object as Stripe.Invoice;

          const user = await GoogleAdsAuth.findOne({
            stripeCustomerId: invoice.customer,
          });

          if (user && invoice.billing_reason === "subscription_cycle") {
            //check if user was on pro created a bunch of campaigns then downgraded
            if (
              user?.createdCampaigns > user?.campaignQuota &&
              user?.planType === "growing"
            ) {
              const diff = user?.createdCampaigns - 10;
              user.campaignQuota = Math.max(0, user.campaignQuota - diff);
            } else {
              user.campaignQuota = user?.planType === "growing" ? 10 : 25;
            }
            user.createdCampaigns = 0;

            await user.save();
          }
        }
        break;
      case "invoice.payment_failed":
        {
          console.log("Invoice.payment_failed");
        }
        break;
      default:
        console.log("no callback...");
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err}`);
    res.status(400).send(`Webhook Error: ${err}`);
  }
}
