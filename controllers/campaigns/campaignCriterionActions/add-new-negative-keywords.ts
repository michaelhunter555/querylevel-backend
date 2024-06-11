import { Request, Response } from "express";
import {
  enums,
  errors,
  MutateOperation,
  ResourceNames,
  resources,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

//manually added negative keywords at campaign_criterion level
export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { campaign, negativeKeywords } = req.body; // objects - need matchtype as well

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const addNegativeKeywordOperation: MutateOperation<resources.ICampaignCriterion>[] =
    [];

  const handleMatchType = (keyword: string) => {
    const phraseMatch = /["'](.*)["']/; //capture all text between ""
    const exactMatch = /\[(.*)\]/; // capture all text between []

    let matchType: number;
    let extractedKeyword: string;

    const checkPhraseMatch = keyword.match(phraseMatch);
    const checkExactMatch = keyword.match(exactMatch);

    if (checkPhraseMatch) {
      extractedKeyword = checkPhraseMatch[1];
      matchType = enums.KeywordMatchType.PHRASE;
    } else if (checkExactMatch) {
      extractedKeyword = checkExactMatch[1];
      matchType = enums.KeywordMatchType.EXACT;
    } else {
      extractedKeyword = keyword;
      matchType = enums.KeywordMatchType.BROAD;
    }

    return {
      keyword: extractedKeyword,
      matchType,
    };
  };

  let index = -1;
  if (negativeKeywords.length > 0) {
    negativeKeywords?.forEach((keyword: string) => {
      //new temp resource
      const negativeCriterionResource = ResourceNames.campaignCriterion(
        customer.credentials.customer_id,
        campaign.id,
        index
      );

      // campaign resource
      const campaignResource = ResourceNames.campaign(
        customer.credentials.customer_id,
        campaign.id
      );

      if (keyword.trim() !== "") {
        const newKeyword = handleMatchType(keyword);
        //keyword criterion to add to campaign resource
        const newNegativeKeywordResource = new resources.CampaignCriterion({
          resource_name: negativeCriterionResource,
          campaign: campaignResource,
          keyword: {
            text: newKeyword.keyword,
            match_type: newKeyword.matchType,
          },
          negative: true,
        });
        index--;

        const negativeKeywordOperation: MutateOperation<resources.ICampaignCriterion> =
          {
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              ...newNegativeKeywordResource,
            },
          };
        addNegativeKeywordOperation.push(negativeKeywordOperation);
      }
    });
  }

  // console.log(
  //   "Manually added Negative Keyword Operation",
  //   ...addNegativeKeywordOperation
  // );

  try {
    await customer.mutateResources([...addNegativeKeywordOperation], {
      partial_failure: true,
    });
    //console.log("SUCCESS");
    res
      .status(201)
      .json({ message: "successfully added negative Keywords.", ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: "error with the request to add negative keyword.",
      ok: false,
    });
  }
}
