import { Request, Response } from "express";
import { errors, ResourceNames, resources, toMicros } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { productPartition } = req.body;

  //find user and prepare credentials
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  //prepare client for instance
  const client = getClient();
  const customer = client.Customer({
    refresh_token: refreshToken,
    customer_id: accountId,
  });

  //negative field is immutable, so delete current partition resource
  const partitionResource = ResourceNames.adGroupCriterion(
    customer.credentials.customer_id,
    productPartition.adGroupId,
    productPartition.partitionId
  );

  //parent resource for new partition
  const parentPartitionResource = ResourceNames.adGroupCriterion(
    customer.credentials.customer_id,
    productPartition.adGroupId,
    productPartition.partitionId
  );
  //new temp resource
  const newPartitionResource = ResourceNames.adGroupCriterion(
    customer.credentials.customer_id,
    productPartition.adGroupId,
    -1
  );
  //ad group resource
  const adGroupResource = ResourceNames.adGroup(
    customer.credentials.customer_id,
    productPartition.adGroupId
  );

  //determine nodes case_value
  let caseValue: { [key: string]: { [key: string]: string } } = {};

  if (productPartition.brand.length > 0) {
    caseValue = { product_brand: { value: productPartition.brand.join("") } };
  } else if (productPartition.productType.length > 0) {
    caseValue = {
      product_type: { value: productPartition.productType.join("") },
    };
  } else if (productPartition.productId.length > 0) {
    caseValue = {
      product_item_id: { value: productPartition.productId.join("") },
    };
  }

  //new partition object
  const newPartition = new resources.AdGroupCriterion({
    resource_name: newPartitionResource,
    cpc_bid_micros: toMicros(0.4),
    ad_group: adGroupResource,
    negative: !productPartition?.negative,
    listing_group: {
      parent_ad_group_criterion: parentPartitionResource,
      type: productPartition.listingGroupType,
      case_value: caseValue,
    },
    status: productPartition.status,
  });

  try {
    await customer.adGroupCriteria.remove([partitionResource]);
    await customer.adGroupCriteria.create([newPartition]);
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
  }
}
