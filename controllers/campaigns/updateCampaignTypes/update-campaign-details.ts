import { Request, Response } from "express";
import { errors, MutateOperation, resources, services } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;
  const { campaignField } = req.body; // {key: value}

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const campaignSettings = new Set(["name"]);

  const campaignEntries = Object.entries(campaignField).filter(
    ([key, value]) => campaignSettings.has(key) && value !== ""
  );

  let updateObject = campaignEntries.reduce(
    (acc: { [key: string]: string | number }, [key, value]) => {
      if (
        key &&
        typeof key === "string" &&
        (typeof value === "number" || typeof value === "string")
      ) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );

  if (Object.entries(updateObject).length > 0) {
    const campaignUpdates = new resources.Campaign({
      resource_name: `customers/${customer?.credentials?.customer_id}/campaigns/${campaignId}`,
      ...updateObject,
    });

    // console.log(campaignUpdates);

    const campaignUpdateOperation: MutateOperation<services.CampaignOperation> =
      {
        entity: "campaign",
        operation: "update",
        resource: campaignUpdates,
        update_mask: {
          paths: Object.keys(updateObject),
        },
      };

    try {
      await customer.mutateResources([campaignUpdateOperation]);
      res
        .status(200)
        .json({ message: "Campaign successfully updated.", ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      return res.status(500).json({
        error: "There was an error updating the campaign.",
        ok: false,
      });
    }
  }
}
