import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";
import { getEditableCampaignData } from "../../util/queries/queries";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const query = getEditableCampaignData(campaignId as string);

  try {
    const results = await customer.query(query);
    res.status(200).json({ campaignData: results });
    //console.log("Get Editable Campaigns RAN");
  } catch (err) {
    console.log("Error getting editable campaigns", err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      error: "There was an error with the request for editable campaign data.",
    });
  }
}
