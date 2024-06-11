import { Request, Response } from "express";
import {
  errors,
  MutateOperation,
  ResourceNames,
  resources,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

//update campaign_criterion negative keyword match types
export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { criterionData, newMatchType } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const removeKeywordsFromNegativeKeywords: string[] = [];
  const createExclusionSearchTerms: MutateOperation<resources.ICampaignCriterion>[] =
    [];
  let tempId = -1;
  const matchType = Number(newMatchType);

  const keys = Object.keys(criterionData);
  if (keys.length > 0) {
    keys?.forEach((key) => {
      const adGroupId = key.split("-")[0];
      const criterionId = key.split("-")[1];
      const searchTerm = key.split("-")[3];

      const campaignCriterionResourceName = ResourceNames.campaignCriterion(
        customer?.credentials?.customer_id,
        adGroupId,
        criterionId
      );

      const temptCampaignCriterionResourceName =
        ResourceNames.campaignCriterion(
          customer?.credentials?.customer_id,
          adGroupId,
          tempId
        );
      tempId--;

      const campaignKeywordCriterion = new resources.CampaignCriterion({
        resource_name: temptCampaignCriterionResourceName,
        keyword: {
          match_type: matchType,
          text: searchTerm as string,
        },
        negative: true,
      });

      const createNegativeKeywordCriterion: MutateOperation<resources.ICampaignCriterion> =
        {
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            ...campaignKeywordCriterion,
          },
        };

      createExclusionSearchTerms.push(createNegativeKeywordCriterion);
      removeKeywordsFromNegativeKeywords.push(campaignCriterionResourceName);
    });

    // console.log(removeKeywordsFromNegativeKeywords);
    // console.log(createExclusionSearchTerms);

    try {
      await customer.campaignCriteria.remove(
        removeKeywordsFromNegativeKeywords
      );
      await customer.mutateResources(createExclusionSearchTerms);
      res.status(200).json({
        message: "Successfully removed keywords from negative keywords",
        ok: true,
      });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({
        message: "There was an error trying to remove keywords.",
        ok: false,
      });
    }
  }
}
