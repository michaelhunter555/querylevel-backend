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
  const { adGroup, status } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const googleAccountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: googleAccountId,
    refresh_token: refreshToken,
  });

  const enabled = enums.AdGroupStatus.ENABLED;
  const paused = enums.AdGroupStatus.PAUSED;

  const mutateAdGroupStatusOperation: MutateOperation<services.AdGroupOperation>[] =
    [];

  if (Array.isArray(adGroup) && status) {
    adGroup.forEach((id) => {
      const adGroupResourceName = ResourceNames.adGroup(
        customer?.credentials?.customer_id,
        id
      );
      const adGroupResource = new resources.AdGroup({
        resource_name: adGroupResourceName,
        status: Number(status),
      });

      const adGroupResourceOperation: MutateOperation<services.AdGroupOperation> =
        {
          entity: "ad_group",
          operation: "update",
          resource: adGroupResource,
          update_mask: {
            paths: ["status"],
          },
        };

      mutateAdGroupStatusOperation.push(adGroupResourceOperation);
    });
  } else if (adGroup?.id) {
    const adGroupResourceName = ResourceNames.adGroup(
      customer?.credentials?.customer_id,
      adGroup?.id
    );

    const adGroupResource = new resources.AdGroup({
      resource_name: adGroupResourceName,
      status: adGroup?.status === enabled ? paused : enabled,
    });

    const updateAdGroupStatusOperation: MutateOperation<services.AdGroupOperation> =
      {
        entity: "ad_group",
        operation: "update",
        resource: adGroupResource,
        update_mask: {
          paths: ["status"],
        },
      };

    //console.log("updateAdGroupStatusOperation", updateAdGroupStatusOperation);

    try {
      await customer.mutateResources([updateAdGroupStatusOperation]);
      res
        .status(200)
        .json({ message: "Successfully updated ad group status.", ok: true });
      //console.log("Success");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({
        message:
          "There was an error with the status mutate operation for ad groups.",
        ok: false,
      });
    }
  }

  if (mutateAdGroupStatusOperation.length > 0) {
    try {
      await customer.mutateResources(mutateAdGroupStatusOperation);
      res.status(200).json({ message: "Success", ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ message: "Error", ok: false });
    }
  }
}
