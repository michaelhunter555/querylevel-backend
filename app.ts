import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import adGroupCriterionRoutes from "./routes/adGroupRoutes/adGroupCriterionRoutes";
import adGroupRoutes from "./routes/adGroupRoutes/adGroupRoutes";
import reportRoutes from "./routes/campaignReportRoutes/campaignReportRoutes";
import campaignCriterionRoutes from "./routes/campaignRoutes/campaignCriterionRoutes";
import campaignRoutes from "./routes/campaignRoutes/campaignRoutes";
import campaignUpdateTypes from "./routes/campaignRoutes/updateCampaignRoutes";
import conversionRoutes from "./routes/conversionRoutes/conversionRoutes";
import appGeneralRoutes from "./routes/others/otherRoutes";
import stripeRoutes from "./routes/stripeRoutes/stripeRoutes";

dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    "https://query-level-bbd02bb2f6c4.herokuapp.com",
    "https://querylevel.com",
    "https://519f5f06cbd0.ngrok.app",
    "https://89477cd74c6f.ngrok.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/plans/stripe-webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use("/api", appGeneralRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/adGroupActions/adGroup", adGroupRoutes);
app.use("/api/adGroupActions/AdGroupCriterionActions", adGroupCriterionRoutes);
app.use("/api/conversionActions", conversionRoutes);
app.use("/api/campaignActions", campaignRoutes);
app.use("/api/campaignActions/campaignCriterion", campaignCriterionRoutes);
app.use("/api/campaignActions/updateCampaignTypes", campaignUpdateTypes);
app.use("/api/plans", stripeRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI: string | undefined = process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable not set");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI as string)
  .then(() => {
    app.listen(PORT);
    console.log(`Listening on PORT: ${PORT}`);
  })
  .catch((err) => {
    console.log("Error connecting to port: " + err);
  });
