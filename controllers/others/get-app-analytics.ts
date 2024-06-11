import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";
import { getAppAnalyticsQuery } from "../../util/queries/queries";

export default async function (req: Request, res: Response) {
  const { id, segment } = req.query; //remove account id

  let googleUser = await findGoogleAuthById(id as string, res);

  const decryptedRefreshToken = decryptData(googleUser.refresh_token);
  const decryptedAccountId = decryptData(googleUser.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: `${decryptedAccountId}`, //google.googleAccountId could go here
    refresh_token: decryptedRefreshToken,
  });

  const query = getAppAnalyticsQuery(segment as string);

  let shouldSelectPlan = false;
  if (googleUser.planType === "") {
    shouldSelectPlan = true;
  }
  let result;

  try {
    result = await customer.query(query);
    res.status(200).json({
      analytics: result,
      createdCampaigns: googleUser?.createdCampaigns,
      shouldSelectPlan,
    });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ message: err });
  }
}
