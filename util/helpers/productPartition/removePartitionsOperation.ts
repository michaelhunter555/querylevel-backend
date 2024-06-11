import { ResourceNames } from "google-ads-api";

/**
 * @name: prepareRemoveOperation
 * @description: The removed ids passed in operation to be checked against the existing tree
 * if in the tree (product_group_view), the partition resource name will be passed into the removePartitionsOperations[]
 * @conditions - existing partition === true && in remove operation
 */
export const prepareRemoveOperation = (
  customerId: string,
  adGroupId: number,
  removedPartitions: string[],
  removePartitionsOperation: string[],
  isExistingPartition: (id: number) => boolean
) => {
  return removedPartitions?.forEach((partition: string) => {
    const partitionId = Number(partition);
    const existingPartition = isExistingPartition(partitionId);
    //if its currently in our active tree...do something
    if (existingPartition) {
      const AdGroupCriterionResource = ResourceNames.adGroupCriterion(
        customerId,
        adGroupId,
        partitionId
      );
      removePartitionsOperation.push(AdGroupCriterionResource);
    }
  });
};
