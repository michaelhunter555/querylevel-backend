import { Request, Response } from "express";
import { errors } from "google-ads-api";

import {
  analyzeProductPartitions,
  analyzeShoppingPerformance,
} from "../../lib/analyzeAdDataHelperts";
import { getClient } from "../../lib/getClient";
import QueryAI from "../../models/QueryGPT";
import { decryptData } from "../../util/encryption/decryptData";
import { encryptData } from "../../util/encryption/encryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

export default async function (req: Request, res: Response) {
  //selected time period to analyze (i.e. last 7, 14 or 30 days)
  //type represents campaign, search terms, ad groups.
  const { segment, type, id, adGroupId } = req.query;

  //retrieve encrypted tokens and decrypt them
  const user = await findGoogleAuthById(String(id), res);

  if (user.gptQuota === 0) {
    return res
      .status(401)
      .json({
        message: "You have used your all your monthly quota :(",
        ok: false,
      });
  }

  //decrypted user data
  const refresh_token = decryptData(user?.refresh_token);
  const customer_id = decryptData(user?.googleAccountId);

  //create new client
  const client = getClient();

  //configure customer for API call
  const customer = client.Customer({ customer_id, refresh_token });

  //determine query by selected type
  let analysisResponse;
  try {
    //decide which analysis to provide
    if (type === "shopping_performance_view") {
      analysisResponse = await analyzeShoppingPerformance(
        customer,
        String(segment),
        type
      );
    } else if (type === "product_group_view") {
      analysisResponse = await analyzeProductPartitions(
        customer,
        Number(adGroupId),
        String(segment),
        type
      );
    }

    if (analysisResponse) {
      //encrypt & add new query to database
      const newAIFeedback = new QueryAI({
        userId: String(id),
        date: new Date(),
        response: encryptData(analysisResponse),
      });

      //save to document
      const ai = await newAIFeedback.save();

      //save the Id to user for association
      user.AIFeedback.push(ai?._id);
      user.gptQuota = user.gptQuota - 1;
      await user.save();
    }

    //return AI response
    res.status(200).json({ analysisResponse, ok: true });
  } catch (err) {
    //handle errors
    let error = "An error has occured";
    if (err instanceof errors.GoogleAdsFailure) {
      error = err.errors[0].message || error;
    }
    res.status(500).json({ error: `${error} ` + err, ok: false });
  }
}
