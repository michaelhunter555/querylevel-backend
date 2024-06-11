import { Request, Response } from "express";
import { errors, MutateOperation, resources, services } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { networkSettings, campaignId } = req.body; // {key: value}

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const networkSettingsSet = new Set([
    "target_google_search",
    "target_search_network",
  ]);

  const networkSettingEntries = Object.entries(networkSettings).filter(
    ([key, value]) => networkSettingsSet.has(key) && value !== undefined
  );

  const updatedNetworkSettings = networkSettingEntries.reduce(
    (acc: { [key: string]: boolean }, [key, value]) => {
      if (key && typeof key === "string" && typeof value === "boolean") {
        acc[key] = value;
      }

      return acc;
    },
    {}
  );

  if (Object.entries(updatedNetworkSettings).length > 0) {
    const updateNetworkSettings = new resources.Campaign({
      resource_name: `customers/${customer?.credentials?.customer_id}/campaigns/${campaignId}`,
      network_settings: {
        ...updatedNetworkSettings,
      },
    });

    const campaignUpdateOperation: MutateOperation<services.CampaignOperation> =
      {
        entity: "campaign",
        operation: "update",
        resource: updateNetworkSettings,
        update_mask: {
          paths: Object.keys(updatedNetworkSettings),
        },
      };

    //console.log("operation: ", campaignUpdateOperation, networkSettings);

    try {
      await customer.mutateResources([campaignUpdateOperation]);
      //console.log("Update Network Settings Successful");
      res
        .status(200)
        .json({ message: "updated networkSettings Successfully." });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      return res
        .status(500)
        .json({ error: "There was an error updating the campaign." });
    }
  } else {
    console.log("Something went wrong.");
  }
}
