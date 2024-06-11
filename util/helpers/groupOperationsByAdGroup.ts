import { Customer, errors, MutateOperation, resources } from "google-ads-api";

import { googleError } from "./googleError";

const MAX_AD_GROUPS_PER_REQUEST = 2; // Maximum number of ad groups per request

// Function to group operations by ad group
export const groupOperationsByAdGroup = (
  operations: MutateOperation<resources.IAdGroupCriterion>[]
) => {
  const groupedOperations: Record<
    string,
    MutateOperation<resources.IAdGroupCriterion>[]
  > = {};

  operations.forEach((operation) => {
    const adGroupId = operation.resource.ad_group;
    if (adGroupId && typeof adGroupId === "string") {
      if (!groupedOperations[adGroupId]) {
        groupedOperations[adGroupId] = [];
      }
      groupedOperations[adGroupId].push(operation);
    } else {
      console.error("Operation has a null or undefined ad_group:", operation);
    }
  });

  return groupedOperations;
};
// Function to execute operations in batches
export const executeBatches = async (
  groupedOperations: Record<
    string,
    MutateOperation<resources.IAdGroupCriterion>[]
  >,
  customer: Customer
) => {
  const adGroupIds = Object.keys(groupedOperations);

  for (let i = 0; i < adGroupIds.length; i += MAX_AD_GROUPS_PER_REQUEST) {
    const batchAdGroupIds = adGroupIds.slice(i, i + MAX_AD_GROUPS_PER_REQUEST);
    const batchOperations = batchAdGroupIds.flatMap(
      (adGroupId) => groupedOperations[adGroupId]
    );

    try {
      await customer.mutateResources(batchOperations);
    } catch (err) {
      console.log("There was an error with the mutate operation.", err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
    }
  }
};
