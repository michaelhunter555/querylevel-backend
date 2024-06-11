import mongoose from "mongoose";

export interface GoogleAuth extends mongoose.Document {
  startPlan?: Date;
  planExpiryDate?: Date;
  planType?: string;
  email?: string | undefined | null;
  name?: string | undefined | null;
  googleAccountId?: string;
  merchantCenterId?: string | number;
  selectedClientId?: string;
  access_token?: string | null | undefined;
  refresh_token?: string | null | undefined;
  createdCampaigns?: number;
  cleanUpService?: boolean;
  theme?: "light" | "dark";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  accountActive?: boolean;
  campaignQuota?: number;
  totalCreatedCampaigns?: number;
  billingHistory?: mongoose.Schema.Types.ObjectId[];
}

const GoogleSchema = new mongoose.Schema<GoogleAuth>(
  {
    startPlan: { type: Date, required: true },
    planExpiryDate: { type: Date, required: true },
    planType: { type: String, required: true, default: "free" },
    email: { type: String, required: true, index: true },
    name: { type: String, required: false },
    selectedClientId: { type: String, required: false },
    googleAccountId: {
      type: String,
      required: false,
      default: "",
      index: true,
    },

    stripeCustomerId: { type: String, required: false, default: "" },
    merchantCenterId: { type: String, require: false, default: "" },
    access_token: { type: String, required: true, index: true },
    refresh_token: { type: String, required: true, index: true },
    createdCampaigns: { type: Number, required: false, default: 0 },
    campaignQuota: { type: Number, required: false, default: 1 },
    totalCreatedCampaigns: { type: Number, required: false, default: 0 },
    cleanUpService: { type: Boolean, required: false, default: false },
    accountActive: { type: Boolean, required: false, default: true },
    stripeSubscriptionId: { type: String, require: false, default: "" },
    theme: { type: String, required: false, default: "light" },
    billingHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "UserBilling",
      },
    ],
  },
  { timestamps: true }
);

//GoogleSchema.index({ access_token: 'hashed', refresh_token: 'hashed', googleAccountId: 'hashed', email: 1})

export default mongoose.models.Google ||
  mongoose.model<GoogleAuth>("Google", GoogleSchema);
