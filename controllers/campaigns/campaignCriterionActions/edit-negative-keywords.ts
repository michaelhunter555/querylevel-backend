import { Request, Response } from "express";
import { errors, ResourceNames, resources } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

//campaign_criterion level
export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { keywordData } = req.body;

  //get user credentials
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  //create client
  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  //check keyword
  if (keywordData.newKeyword.trim() !== "") {
    //campaign resource
    const campaignResourceName = ResourceNames.campaign(
      customer.credentials.customer_id,
      keywordData?.campaignId
    );
    //resource to remove
    const campaignCriterionResourceName = ResourceNames.campaignCriterion(
      customer.credentials?.customer_id,
      keywordData?.campaignId,
      keywordData?.criterionId
    );

    //temp resource for new keyword
    const tempCampaignCriterionResource = ResourceNames.campaignCriterion(
      customer.credentials?.customer_id,
      keywordData?.campaignId,
      -1
    );

    //create new campaign criterion keyword resource
    const newKeywordCampaignCriterion = new resources.CampaignCriterion({
      resource_name: tempCampaignCriterionResource,
      campaign: campaignResourceName,
      keyword: {
        text: keywordData.newKeyword,
        match_type: keywordData.newMatchType,
      },
      negative: true,
    });

    try {
      //remove then create
      await customer.campaignCriteria.remove([campaignCriterionResourceName]);
      await customer.campaignCriteria.create([newKeywordCampaignCriterion]);
      res
        .status(201)
        .json({ message: "Successfully edited keyword", ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ message: "Failed to update keyword", ok: false });
    }
  }
}
