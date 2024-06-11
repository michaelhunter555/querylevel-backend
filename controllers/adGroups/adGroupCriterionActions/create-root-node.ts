import { Request, Response } from "express";
import {
  enums,
  errors,
  MutateOperation,
  resources,
  toMicros,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, adGroupId } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const customerId = customer.credentials.customer_id;

  const createRootNode: resources.IAdGroupCriterion = {
    resource_name: `customers/${customerId}/adGroupCriteria/${adGroupId}~-1`,
    ad_group: `customers/${customerId}/adGroups/${adGroupId}`,
    cpc_bid_micros: toMicros(0.4),
    negative: false,
    listing_group: {
      parent_ad_group_criterion: null,
      type: enums.ListingGroupType.UNIT,
      case_value: null,
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  };

  const createRootNodeOperation: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: createRootNode,
    };

  try {
    await customer.mutateResources([createRootNodeOperation]);
    // console.log("Successfully done!");
    res
      .status(200)
      .json({ message: "successfully created root node", ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res
      .status(500)
      .json({ error: "Error creating root node " + err, ok: false });
  }
}
