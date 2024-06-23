import mongoose from "mongoose";

export interface UserBilling extends mongoose.Document {
  stripeCustomerId: string;
  amountPaid: number;
  billingReason: string;
  chargeId: string;
  periodEnd: number;
  periodStart: number;
  invoiceUrl?: string;
  currency?: string;
}

const BillingSchema = new mongoose.Schema<UserBilling>({
  stripeCustomerId: {
    type: String,
    required: true,
    ref: "Google",
  },
  amountPaid: { type: Number, required: false, default: 0 },
  billingReason: { type: String, required: false, default: "" },
  chargeId: { type: String, required: false, default: "" },
  periodEnd: { type: Number, required: false, default: 0 },
  periodStart: { type: Number, required: false, default: 0 },
  invoiceUrl: { type: String, required: false, default: "" },
  currency: { type: String, required: false, default: "usd" },
});

export default mongoose.models.UserBilling ||
  mongoose.model<UserBilling>("UserBilling", BillingSchema);
