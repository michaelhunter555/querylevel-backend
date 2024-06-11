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

//add search term negative keywords ad_group_criterion level
export default async function (req: Request, res: Response) {
  const { id, matchType } = req.query;
  const { keywords } = req.body; // objects - need matchtype as well

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const addNegativeKeywordOperation: MutateOperation<resources.IAdGroupCriterion>[] =
    [];
  //dc dimplex fireplace-ZGMgZGltcGxleCBmaXJlcGxhY2U-125905678259

  let index = -1;
  const addedKeywords = Object.keys(keywords);
  if (addedKeywords.length > 0) {
    addedKeywords?.forEach((keyword: string) => {
      const negativeKeyword = keyword.split("|")[0];
      //const criterionId = keyword.split("-")[1];
      const adGroupId = keyword.split("|")[2];

      //new temp resource
      const negativeCriterionResource = ResourceNames.adGroupCriterion(
        customer.credentials.customer_id,
        adGroupId,
        index
      );

      // campaign resource
      const adGroupResource = ResourceNames.adGroup(
        customer.credentials.customer_id,
        adGroupId
      );

      //keyword criterion to add to campaign resource
      const newNegativeKeywordResource = new resources.AdGroupCriterion({
        resource_name: negativeCriterionResource,
        ad_group: adGroupResource,
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

      const negativeKeywordOperation: MutateOperation<resources.IAdGroupCriterion> =
        {
          entity: "ad_group_criterion",
          operation: "create",
          resource: {
            ...newNegativeKeywordResource,
          },
        };
      addNegativeKeywordOperation.push(negativeKeywordOperation);
    });
  }

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
