import { Request, Response } from "express";
import { errors, ResourceNames } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { campaignIds } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const removeCampaignOperation: string[] = [];
  const campaignIdList = Object.keys(campaignIds);
  if (campaignIdList.length > 0) {
    campaignIdList.forEach((id) => {
      const campaignResource = ResourceNames.campaign(
        customer.credentials.customer_id,
        id
      );
      removeCampaignOperation.push(campaignResource);
    });
  }

  //console.log("campaigns to remove", removeCampaignOperation);
  if (removeCampaignOperation.length > 0) {
    try {
      await customer.campaigns.remove([...removeCampaignOperation]);
      res
        .status(200)
        .json({ message: `campagin was successfully removed`, ok: true });
      // console.log("SUCCESS");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ message: err, ok: false });
    }
  }
}
