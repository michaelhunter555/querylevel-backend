import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";
import { getCampaignQuery } from "../../util/queries/queries";

export default async function getUserCampaigns(req: Request, res: Response) {
  const { userId, segment, status } = req.query;

  let googleAccount = await findGoogleAuthById(userId as string, res);

  const decryptedRefreshToken = decryptData(googleAccount.refresh_token);
  const decryptedAccountId = decryptData(googleAccount.googleAccountId);
  //Create client instance
  const client = getClient();

  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  let queryData = getCampaignQuery(segment as string, status as string);
  let campaigns;

  try {
    campaigns = await customer.query(queryData);
    res.status(200).json({ campaigns });
  } catch (err) {
    console.error(err);
    if (err instanceof errors.GoogleAdsFailure) {
      await googleError(err);
    }
    res.status(500).json({ error: "Failed to get user campaigns" });
  }
}
