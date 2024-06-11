import { Customer, errors } from "google-ads-api";

import { ProductGroupViewResponse } from "../../../types";
import { getProductTreeQuery } from "../../queries/queries";
import { googleError } from "../googleError";

/**
 *
 * @param customer
 * @param adGroupId
 * @returns
 */
export const getProductTreeForPartitionOperation = async (
  customer: Customer,
  adGroupId: number
) => {
  const query = getProductTreeQuery(adGroupId);
  let result: ProductGroupViewResponse = [];
  try {
    result = await customer.query(query);
    return result;
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
  }
};
