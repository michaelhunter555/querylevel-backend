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

//add search term negative keywords
export default async function (req: Request, res: Response) {
  const { id, matchType } = req.query;
  const { keywords } = req.body; // objects - need matchtype as well
  //console.log(keywords);

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

  let index = -1;
  const addedKeywords = Object.keys(keywords);
  if (addedKeywords.length > 0) {
    addedKeywords?.forEach((keyword: string) => {
      const negativeKeyword = keyword.split("|")[0];
      //const criterionId = keyword.split("-")[1];
      const campaignId = keyword.split("|")[3];

      //new temp resource
      const negativeCriterionResource = ResourceNames.campaignCriterion(
        customer.credentials.customer_id,
        campaignId,
        index
      );

      // campaign resource
      const campaignResource = ResourceNames.campaign(
        customer.credentials.customer_id,
        campaignId
      );

      //keyword criterion to add to campaign resource
      const newNegativeKeywordResource = new resources.CampaignCriterion({
        resource_name: negativeCriterionResource,
        campaign: campaignResource,
        keyword: {
          text: negativeKeyword,
          match_type:
            enums.KeywordMatchType[
              matchType as keyof typeof enums.KeywordMatchType
            ],
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
    });
  }

  //console.log("Negative Keyword Operation", ...addNegativeKeywordOperation);

  try {
    await customer.mutateResources([...addNegativeKeywordOperation]);
    // console.log("SUCCESS");
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
