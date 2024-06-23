import express, { Router } from "express";

import deletePlan from "../../controllers/stripe/delete-plan";
import getUserAccountSettings from "../../controllers/stripe/get-user-account-settings";
import prorationPreview from "../../controllers/stripe/proration-preview";
import selectNewPlan from "../../controllers/stripe/selectNewPlan";
import stripeWebhook from "../../controllers/stripe/stripe-webhook";
import updatePlan from "../../controllers/stripe/update-plan";

const router = Router();

router.get("/get-user-account-settings", getUserAccountSettings);

router.get("/proration-preview", prorationPreview);

router.post("/selectNewPlan", selectNewPlan);

router.post("/delete-plan", deletePlan);

router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.post("/update-plan", updatePlan);

export default router;
