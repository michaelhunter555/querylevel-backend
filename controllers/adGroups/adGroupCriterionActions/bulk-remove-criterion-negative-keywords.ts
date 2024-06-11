import { Request, Response } from "express";
import { errors, ResourceNames } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

//removes negative keywords at ad_group_criterion level
export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { criterionData } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const removeKeywordsFromNegativeKeywords: string[] = [];

  const keys = Object.keys(criterionData);
  if (keys.length > 0) {
    keys?.forEach((key) => {
      const adGroupId = key.split("-")[0];
      const criterionId = key.split("-")[1];

      const adGroupCriterionResourceName = ResourceNames.adGroupCriterion(
        customer?.credentials?.customer_id,
        adGroupId,
        criterionId
      );

      removeKeywordsFromNegativeKeywords.push(adGroupCriterionResourceName);
    });

    // console.log(removeKeywordsFromNegativeKeywords);

    try {
      await customer.adGroupCriteria.remove(removeKeywordsFromNegativeKeywords);
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
