import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const query = `
  SELECT 
  bidding_strategy.id, 
  bidding_strategy.name, 
  bidding_strategy.status, 
  bidding_strategy.type, 
  bidding_strategy.campaign_count,
  bidding_strategy.aligned_campaign_budget_id
FROM bidding_strategy
WHERE bidding_strategy.type = 'TARGET_ROAS'
AND bidding_strategy.status = 'ENABLED'
  `;

  try {
    const biddingStrategyInfo = await customer.query(query);
    // console.log(biddingStrategyInfo);
    res.status(200).json({ biddingStrategies: biddingStrategyInfo });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message:
        "there was an error with the request to obtain bidding strategy info.",
    });
  }
}
