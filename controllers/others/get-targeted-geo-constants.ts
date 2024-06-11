import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const query = `
    SELECT
    campaign_criterion.location.geo_target_constant,
    campaign_criterion.criterion_id,
    campaign_criterion.negative,
    campaign.id
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}`;

  try {
    const locationResult = await customer.query(query);
    res.status(200).json({ locationResult });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res
      .status(500)
      .json({ message: "Error with the request for location info." + err });
  }
}
