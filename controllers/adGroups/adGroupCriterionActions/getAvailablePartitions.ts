import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  let query = `
  SELECT ad_group_criterion.cpc_bid_micros, 
  ad_group_criterion.listing_group.type, 
  ad_group_criterion.status, 
  ad_group_criterion.criterion_id, 
  ad_group_criterion.listing_group.parent_ad_group_criterion, 
  ad_group_criterion.listing_group.case_value.product_type.level, 
  ad_group_criterion.listing_group.case_value.product_brand.value, 
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value,
  ad_group_criterion.listing_group.case_value.product_condition.condition,
  ad_group_criterion.negative, 
  ad_group_criterion.resource_name, 
  ad_group_criterion.topic.path, 
  ad_group.id 
  FROM ad_group_criterion 
  WHERE ad_group_criterion.listing_group.type IN ('SUBDIVISION', 'UNIT')
`;

  let result;
  try {
    result = await customer.query(query);
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res
      .status(500)
      .json({ message: "Error retrieving partition data:" + err });
  }

  const nodeMap = new Map();

  result?.forEach((criterion) => {
    const brand =
      criterion.ad_group_criterion?.listing_group?.case_value?.product_brand
        ?.value;
    const productType =
      criterion.ad_group_criterion?.listing_group?.case_value?.product_type
        ?.value;
    const productId =
      criterion.ad_group_criterion?.listing_group?.case_value?.product_item_id
        ?.value;

    const parentId =
      criterion.ad_group_criterion?.listing_group?.parent_ad_group_criterion
        ?.split("~")
        .pop();
    const listingGroupType = criterion.ad_group_criterion?.listing_group?.type;
    const status = criterion.ad_group_criterion?.status;
    const negative = criterion.ad_group_criterion?.negative;

    const nodeId = criterion.ad_group_criterion?.criterion_id;

    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, {
        listingGroupType: listingGroupType,
        parentId: parentId,
        status: status,
        negative: negative,
        brand: new Set(),
        productType: new Set(),
        productId: new Set(),
      });
    }

    const node = nodeMap.get(nodeId);

    if (brand) {
      node.brand.add(brand);
    }

    if (productType) {
      node.productType.add(productType);
    }

    if (productId) {
      node.productId.add(productId);
    }
  });

  const finalData = Array.from(nodeMap.entries()).map(([nodeId, node]) => {
    return {
      ...node,
      partitionId: nodeId,
      brand: Array.from(node.brand),
      productType: Array.from(node.productType),
      productId: Array.from(node.productId),
    };
  });

  res.status(200).json({ result: finalData });
}
