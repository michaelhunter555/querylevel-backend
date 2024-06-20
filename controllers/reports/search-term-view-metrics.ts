import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, segment, campaignId } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  if (!user.googleAccountId) {
    return res
      .status(400)
      .json({ message: "Google Id account not found", noAccountId: true });
  }

  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: `${decryptedAccountId}`,
    refresh_token: decryptedRefreshToken,
  });

  const queryData = `
    SELECT
        campaign.id,
        campaign.name,
        ad_group.name,
        ad_group.id,
        search_term_view.search_term,
        search_term_view.status,
        segments.search_term_match_type,
        search_term_view.ad_group,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.all_conversions
    FROM
    search_term_view
    WHERE
        campaign.status = 'ENABLED'
        AND campaign.advertising_channel_type = 'SHOPPING'
        AND segments.date DURING ${segment}
        AND campaign.id = ${campaignId}
    ORDER by
        metrics.clicks ASC
    `;

  let result;

  try {
    result = await customer.query(queryData);
    //console.log("SearchTermView", result);
    res.status(200).json({ searchTermViewMetrics: result });
    //console.log("SEARCH TERMS RAN");
  } catch (err) {
    console.log(err);

    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res.status(500).json({
      message: "There was an error with the query in customer-metrics.",
    });
  }
}
