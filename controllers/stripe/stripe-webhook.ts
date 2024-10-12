import { Request, Response } from "express";
import Stripe from "stripe";

import Billing, { UserBilling } from "../../models/Billing";
import StripeBilling from "../../models/Billing";
import GoogleAdsAuth from "../../models/GoogleAdsAuth";

//FOR TESTING use => process.env.STRIPE_TEST_SECRET_KEY
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
      //FOR TESTING use => process.env.STRIPE_TEST_WEBHOOK_SECRET
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
              user.campaignQuota =
                subscription?.metadata?.planType === "growing" ? 10 : Infinity; //campaignQuota//Infinity
              user.planType = subscription.metadata.planType;
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
            user.createdCampaigns = 0;
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

          //handles individual purchase events
          if (session.payment_intent && session.payment_status === "paid") {
            // await stripe.invoices.sendInvoice(session.id);

            const purchaseData: Partial<UserBilling> = {
              stripeCustomerId: String(session?.customer),
              amountPaid: Number(session?.amount_total),
              chargeId: String(session?.payment_intent),
              periodStart: session?.created * 1000,
              periodEnd: 0,
              invoiceUrl: "",
              currency: String(session?.currency),
            };
            const newPurchase = new Billing(purchaseData);
            await newPurchase.save();

            //if user !== canceled || free... user === 'growing' || user === 'pro'
            if (user && session?.metadata?.planType === "payAsYouGo") {
              if (user.planType === "free" || user.planType === "canceled") {
                user.planType = session.metadata.planType;
              }
              user.campaignQuota = user.campaignQuota += Number(
                session.metadata.quantity
              );
              user.accountActive = true;
              await user.save();
            }
          }

          //handles subscription events
          if (session.subscription && session.payment_status === "paid") {
            const subscription = await stripe.subscriptions.retrieve(
              session?.subscription as string
            );

            const startPeriod = new Date(
              subscription?.current_period_start * 1000
            );
            const endPeriod = new Date(subscription?.current_period_end * 1000);

            if (user) {
              user.planType = session?.metadata?.planType;
              user.accountActive = true;

              user.startPlan = startPeriod;
              user.stripeSubscriptionId = String(session.subscription);
              user.planExpiryDate = endPeriod;

              if (session?.metadata?.planType === "pro") {
                //if metadata.prevPlanPayAsGo ? user.campaign = user.campaign += 15 : user.campaign = 15;
                user.campaignQuota = Infinity;
                user.cleanUpService = true;
              } else if (session?.metadata?.planType === "growing") {
                //if metadata.prevPlanPayAsGo ? user.campaign = user.campaign += 10 : user.campaign = 10;
                if (session?.metadata?.oldPlanType === "payAsYouGo") {
                  user.campaignQuota =
                    Number(session?.metadata?.oldQuantity) + 10;
                } else {
                  user.campaignQuota = 10;
                }
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

          //create new billing object for transaction
          const newBillingData: Partial<UserBilling> = {
            stripeCustomerId: invoice.customer as string,
            amountPaid: invoice.amount_paid,
            billingReason: invoice.billing_reason as string,
            chargeId: invoice.charge as string,
            periodEnd: invoice.period_end * 1000,
            periodStart: invoice.period_start * 1000,
            invoiceUrl: invoice.hosted_invoice_url as string,
            currency: invoice.currency as string,
          };

          const newStripeBilling = new StripeBilling(newBillingData);

          await newStripeBilling.save();

          if (user) {
            user.billingHistory.push(newStripeBilling?._id);

            if (invoice.billing_reason === "subscription_cycle") {
              //check if user was on pro created a bunch of campaigns then downgraded
              if (
                user?.createdCampaigns > user?.campaignQuota &&
                user?.planType === "growing"
              ) {
                const diff = user?.createdCampaigns - 10;
                user.campaignQuota = Math.max(0, user.campaignQuota - diff);
              } else {
                user.campaignQuota =
                  user?.planType === "growing" ? 10 : Infinity;
              }
              user.createdCampaigns = 0;
            }
            await user.save();
          }
        }
        break;
      case "invoice.payment_failed":
        {
          console.log("Invoice.payment_failed");
          //
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
