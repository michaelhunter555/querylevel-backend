import { Request, Response } from "express";
import {
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  services,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;
  const { campaignShoppingSettings } = req.body; // {key: value}

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const campaignResourceName = ResourceNames.campaign(
    customer?.credentials?.customer_id,
    campaignId as string
  );
  const updateCampaignResource = new resources.Campaign({
    resource_name: campaignResourceName,
    shopping_setting: {
      campaign_priority: Number(campaignShoppingSettings?.campaign_priority),
    },
  });

  const campaignUpdateOperation: MutateOperation<services.CampaignOperation> = {
    entity: "campaign",
    operation: "update",
    resource: updateCampaignResource,
    update_mask: {
      paths: ["shopping_setting", "campaign_priority"],
    },
  };

  try {
    await customer.mutateResources([campaignUpdateOperation]);
    // console.log("Successfully updated");
    res.status(200).json({ message: "Success" });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res
      .status(500)
      .json({ error: "There was an error updating the campaign." });
  }
}
