import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, keywordLevel, campaignId } = req.query;
  //console.log("id: ", campaignId);

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const query = `
  SELECT 
  ad_group_criterion.keyword.text, 
  ad_group_criterion.keyword.match_type, 
  ad_group_criterion.criterion_id, 
  ad_group.id, 
  campaign.id, 
  campaign.name, 
  ad_group.name, 
  ad_group_criterion.negative 
FROM ad_group_criterion 
WHERE campaign.id = ${campaignId}
`;

  const campaignQuery = `
SELECT
campaign_criterion.criterion_id,
campaign_criterion.keyword.match_type,
campaign_criterion.keyword.text,
campaign.id,
campaign.name,
campaign_criterion.negative
FROM campaign_criterion
WHERE campaign.id = ${campaignId}`;

  try {
    const [adGroupCriterion, campaignCriterion] = await Promise.all([
      customer.query(query),
      customer.query(campaignQuery),
    ]);
    // const adGroupCriterion = await customer.query(query);
    // const campaignCriterion = await customer.query(campaignQuery);
    res.status(200).json({ adGroupCriterion, campaignCriterion });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ message: "Error" });
  }
}
