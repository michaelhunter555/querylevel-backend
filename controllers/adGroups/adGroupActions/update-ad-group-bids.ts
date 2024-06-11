import { Request, Response } from "express";
import {
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  services,
  toMicros,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { adGroup, newBid } = req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const googleAccountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: googleAccountId,
    refresh_token: refreshToken,
  });

  const mutateAdGroupBidOperation: MutateOperation<services.AdGroupOperation>[] =
    [];

  //helper for operation
  const createAdGroupBidOperation = (
    customerId: string,
    adGroupId: string | number,
    newBid: number
  ): MutateOperation<services.AdGroupOperation> => {
    const adGroupResourceName = ResourceNames.adGroup(customerId, adGroupId);
    const adGroupResource = new resources.AdGroup({
      resource_name: adGroupResourceName,
      cpc_bid_micros: toMicros(Number(newBid)),
    });

    return {
      entity: "ad_group",
      operation: "update",
      resource: adGroupResource,
      update_mask: {
        paths: ["cpc_bid_micros"],
      },
    };
  };

  if (Array.isArray(adGroup) && newBid > 0) {
    adGroup.forEach((id) => {
      const bulkAdGroupBidOperation = createAdGroupBidOperation(
        customer.credentials?.customer_id,
        id,
        newBid
      );
      mutateAdGroupBidOperation.push(bulkAdGroupBidOperation);
    });
  } else if (adGroup?.id && newBid > 0) {
    const singleAdGroupBidOperation = createAdGroupBidOperation(
      customer.credentials?.customer_id,
      adGroup?.id,
      newBid
    );

    try {
      await customer.mutateResources([singleAdGroupBidOperation]);
      //console.log("Invidiual SUCCESS", singleAdGroupBidOperation);
      res.status(200).json({ message: "updating bids successful", ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ message: "failed to update bids", ok: false });
    }
  }

  if (mutateAdGroupBidOperation.length > 0) {
    //console.log("Mutate ad group bid operation", mutateAdGroupBidOperation);
    try {
      await customer.mutateResources(mutateAdGroupBidOperation);
      //console.log("BULK SUCCESS");
      res.status(200).json({ message: "success", ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ message: "error", ok: false });
    }
  }
}
