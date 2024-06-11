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
  const { id } = req.query;
  const { enableLocal, campaignId } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const campaignResourceName = ResourceNames.campaign(
    customer.credentials?.customer_id,
    campaignId
  );

  const campaignResource = new resources.Campaign({
    resource_name: campaignResourceName,
    shopping_setting: {
      enable_local: enableLocal as boolean,
    },
  });

  const updateCampaignOperation: MutateOperation<services.CampaignOperation> = {
    entity: "campaign",
    operation: "update",
    resource: campaignResource,
    update_mask: {
      paths: ["shopping_settings", "enable_local"],
    },
  };

  //console.log("updated campaign", updateCampaignOperation);

  try {
    await customer.mutateResources([updateCampaignOperation]);
    // console.log("Success");
    res.status(200).json({
      message: "Successfully updated campaign's local inventory",
      ok: true,
    });
  } catch (err) {
    console.log(err);
    //console.log("Fail");
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: "Error with the request to update local inventory.",
      ok: false,
    });
  }
}
