import { Request, Response } from "express";
import { errors, MutateOperation, resources, toMicros } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { selectedNode, cpcBid } = req.body;

  //find user and get tokens decrypted
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  //instantiate client
  const client = getClient();

  //login details
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  if (cpcBid > 0) {
    const newPartition = new resources.AdGroupCriterion({
      resource_name: selectedNode?.AdGroupCriterionResource,
      cpc_bid_micros: toMicros(cpcBid), //updated cpc
    });

    const updateCpcBid: MutateOperation<resources.IAdGroupCriterion> = {
      entity: "ad_group_criterion",
      operation: "update",
      resource: {
        ...newPartition,
      },
    };

    //update cpc, mutable - no need to remove first
    try {
      await customer.mutateResources([updateCpcBid]);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ ok: false });
    }
  }
}
