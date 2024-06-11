import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const accountId = decryptData(user.googleAccountId);
  const refreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const query = `
    SELECT 
    campaign_criterion.listing_scope.dimensions,
    campaign_criterion.criterion_id,
    campaign.id
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
    `;

  try {
    const result = await customer.query(query);
    const filteredData =
      result.filter((r) => r.campaign_criterion?.listing_scope !== null) || [];
    res.status(200).json({ listingScope: filteredData, ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: "error with request to retrieve listing scope info.",
      ok: false,
    });
  }
}
