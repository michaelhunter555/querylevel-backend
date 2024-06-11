import { Request, Response } from "express";
import {
  enums,
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  toMicros,
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
  const customerId = customer?.credentials?.customer_id;
  const tempAdGroupResource = ResourceNames.adGroup(customerId, -1);

  const newAdGroupResource = new resources.AdGroup({
    resource_name: tempAdGroupResource,
    name: adGroup?.name,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SHOPPING_PRODUCT_ADS,
    cpc_bid_micros: toMicros(adGroup.adGroupCpcBid),
    campaign: adGroup.campaignResource, //get campaign
  });

  const createNewAdGroupOperation: MutateOperation<resources.IAdGroup> = {
    entity: "ad_group",
    operation: "create",
    resource: {
      ...newAdGroupResource,
    },
  };

  try {
    await customer.mutateResources([createNewAdGroupOperation]);
    //console.log("successfully created ad group");
    res.status(201).json({ ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ ok: false });
  }
}
