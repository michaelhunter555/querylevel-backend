import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, keywordLevel, campaignId } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  if (!user.googleAccountId) {
    return res
      .status(400)
      .json({ message: "Google Id account not found", noAccountId: true });
  }

  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  let negativeKeywordQuery: string = "";

  if (keywordLevel === "AD_GROUP") {
    negativeKeywordQuery = `
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
  LIMIT 100
  `;
  } else if (keywordLevel === "CAMPAIGN") {
    negativeKeywordQuery = `
    SELECT
    campaign_criterion.criterion_id,
    campaign_criterion.keyword.match_type,
    campaign_criterion.keyword.text,
    campaign.id,
    campaign.name,
    campaign_criterion.negative
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
    LIMIT 100`;
  }

  try {
    const response = await customer.query(negativeKeywordQuery);

    if (keywordLevel === "AD_GROUP") {
      res.status(200).json({ adGroupCriterion: response, keywordLevel });
    } else {
      res.status(200).json({ campaignCriterion: response, keywordLevel });
    }
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: `Error retrieving negative keywords at ${keywordLevel}`,
    });
  }
}
