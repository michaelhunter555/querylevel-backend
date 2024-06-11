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
import { handleMatchType } from "../../../util/helpers/handleMatchType";

//add search term negative keywords ad_group_criterion level
export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { adGroup, negativeKeywords } = req.body; // objects - need matchtype as well

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

  if (negativeKeywords.length > 0) {
    negativeKeywords?.forEach((keyword: string) => {
      //new temp resource
      const negativeCriterionResource = ResourceNames.adGroupCriterion(
        customer.credentials.customer_id,
        adGroup.id,
        index
      );

      // campaign resource
      const adGroupResource = ResourceNames.adGroup(
        customer.credentials.customer_id,
        adGroup.id
      );

      if (keyword.trim() !== "") {
        const newKeyword = handleMatchType(keyword);
        //keyword criterion to add to campaign resource
        const newNegativeKeywordResource = new resources.AdGroupCriterion({
          resource_name: negativeCriterionResource,
          ad_group: adGroupResource,
          keyword: {
            text: newKeyword.keyword,
            match_type: newKeyword.matchType,
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
      }
    });
  }

  // console.log("Negative Keyword Operation", ...addNegativeKeywordOperation);

  try {
    await customer.mutateResources([...addNegativeKeywordOperation], {
      partial_failure: true,
    });
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
