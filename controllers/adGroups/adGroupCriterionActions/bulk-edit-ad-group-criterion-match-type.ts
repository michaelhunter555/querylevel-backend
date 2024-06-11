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
  const createExclusionSearchTerms: MutateOperation<resources.IAdGroupCriterion>[] =
    [];
  let tempId = -1;
  const matchType = Number(newMatchType);

  const keys = Object.keys(criterionData);
  if (keys.length > 0) {
    keys?.forEach((key) => {
      const adGroupId = key.split("-")[0];
      const criterionId = key.split("-")[1];
      const searchTerm = key.split("-")[3];

      const adGroupResourceName = ResourceNames.adGroup(
        customer.credentials?.customer_id,
        adGroupId
      );

      const adGroupCriterionResourceName = ResourceNames.adGroupCriterion(
        customer?.credentials?.customer_id,
        adGroupId,
        criterionId
      );

      const temptAdGroupCriterionResourceName = ResourceNames.adGroupCriterion(
        customer?.credentials?.customer_id,
        adGroupId,
        tempId
      );
      tempId--;

      const adGroupKeywordCriterion = new resources.AdGroupCriterion({
        resource_name: temptAdGroupCriterionResourceName,
        ad_group: adGroupResourceName,
        keyword: {
          match_type: matchType,
          text: searchTerm as string,
        },
        negative: true,
      });

      const createNegativeKeywordCriterion: MutateOperation<resources.IAdGroupCriterion> =
        {
          entity: "ad_group_criterion",
          operation: "create",
          resource: {
            ...adGroupKeywordCriterion,
          },
        };

      createExclusionSearchTerms.push(createNegativeKeywordCriterion);
      removeKeywordsFromNegativeKeywords.push(adGroupCriterionResourceName);
    });

    // console.log(removeKeywordsFromNegativeKeywords);
    // console.log(createExclusionSearchTerms);

    try {
      await customer.adGroupCriteria.remove(removeKeywordsFromNegativeKeywords);
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
