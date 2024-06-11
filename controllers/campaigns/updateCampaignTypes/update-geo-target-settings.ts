import { Request, Response } from "express";
import { errors, MutateOperation, resources, services } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;
  const { geoTargetSettings } = req.body; // {key: value}

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const updateCampaign = new resources.Campaign({
    resource_name: `customers/${customer?.credentials?.customer_id}/campaigns/${campaignId}`,
    geo_target_type_setting: {
      positive_geo_target_type: Number(
        geoTargetSettings.positive_geo_target_type
      ),
    },
  });

  const campaignUpdateOperation: MutateOperation<services.CampaignOperation> = {
    entity: "campaign",
    operation: "update",
    resource: updateCampaign,
    update_mask: {
      paths: ["positive_geo_target_type"],
    },
  };

  try {
    await customer.mutateResources([campaignUpdateOperation]);
    //console.log("No Errors");
    res.status(200).json({ message: "Network settings updated." });
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
