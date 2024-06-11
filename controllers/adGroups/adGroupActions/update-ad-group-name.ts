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
  const { adGroup } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const googleAccountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: googleAccountId,
    refresh_token: refreshToken,
  });

  if (adGroup?.name && adGroup?.name.length > 0) {
    const adGroupResourceName = ResourceNames.adGroup(
      customer.credentials?.customer_id,
      adGroup?.id
    );

    const updateAdGroupNameResource = new resources.AdGroup({
      resource_name: adGroupResourceName,
      name: adGroup?.name,
    });

    const updateAdGroupNameOperation: MutateOperation<services.AdGroupOperation> =
      {
        entity: "ad_group",
        operation: "update",
        resource: updateAdGroupNameResource,
        update_mask: {
          paths: ["name"],
        },
      };

    //console.log("new AdGroupNAme", updateAdGroupNameOperation);

    try {
      await customer.mutateResources([updateAdGroupNameOperation]);
      res
        .status(200)
        .json({ message: "Succesfully updated ad group name", ok: true });
      //console.log("SUCCESS on adname change");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ message: "Ad group name update failed", ok: false });
    }
  }
}
