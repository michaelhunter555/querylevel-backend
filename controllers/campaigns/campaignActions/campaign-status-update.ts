import { Request, Response } from "express";
import {
  enums,
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
  const { status, campaigns } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const campaignStatusOperationArray: MutateOperation<services.CampaignOperation>[] =
    [];

  //get all ids
  const campaignIds = Object.keys(campaigns);
  //checks if status is Enabled and there are ids in the operation
  if (status === "ENABLED" && campaignIds.length > 0) {
    campaignIds.forEach((id) => {
      //create resource for each id
      const resource = ResourceNames.campaign(
        customer.credentials.customer_id,
        id
      );
      //create mutation object
      const newCampaignResource = new resources.Campaign({
        resource_name: resource,
        status: enums.CampaignStatus.PAUSED,
      });

      const pauseCampaignOperation: MutateOperation<services.CampaignOperation> =
        {
          entity: "campaign",
          operation: "update",
          resource: newCampaignResource,
          update_mask: {
            paths: ["status"],
          },
        };
      //push for op
      campaignStatusOperationArray.push(pauseCampaignOperation);
    });

    try {
      await customer.mutateResources(campaignStatusOperationArray);
      res
        .status(200)
        .json({ message: `campagin was successfully paused`, ok: true });
      //console.log("SUCCESS STATUS CHANGE");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ message: `error pausing campaign: ${err}`, ok: false });
    }
  } else if (status !== "ENABLED" && campaignIds.length > 0) {
    campaignIds.forEach((id) => {
      const resource = ResourceNames.campaign(
        customer.credentials.customer_id,
        id
      );

      const newCampaignResource = new resources.Campaign({
        resource_name: resource,
        status: enums.CampaignStatus.ENABLED,
      });

      const enableCampaignOperation: MutateOperation<services.CampaignOperation> =
        {
          entity: "campaign",
          operation: "update",
          resource: newCampaignResource,
          update_mask: {
            paths: ["status"],
          },
        };
      campaignStatusOperationArray.push(enableCampaignOperation);
    });

    try {
      await customer.mutateResources(campaignStatusOperationArray);
      res
        .status(200)
        .json({ message: `campaign(s) successfully enabled.`, ok: true });
      //console.log("SUCCESS STATUS CHANGE");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({
        message: `campaign(s) were not enabled please contact us.`,
        ok: false,
      });
    }
  }

  //console.log("operations", campaignStatusOperationArray);
}
