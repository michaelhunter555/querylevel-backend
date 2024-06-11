import {
  enums,
  MutateOperation,
  ResourceNames,
  resources,
  toMicros,
} from "google-ads-api";

import { CriterionData } from "../../../types";

/**
 * @name: addProductPartitionOperation
 * @description: prepare partitions for operation only if not in existing tree and not to be removed.
 * @conditions - not in removal operation && not in existing tree
 */
export const addProductPartitionsOperation = (
  customer: string,
  adGroupId: number,
  tempId: number,
  createSubdivision: boolean,
  partitionData: CriterionData[],
  removedPartitions: string[],
  addPartitionOperation: MutateOperation<resources.IAdGroupCriterion>[],
  isExistingPartition: (id: number) => boolean
) => {
  return partitionData?.forEach((partition: CriterionData, i: number) => {
    let caseValue: { [key: string]: { [key: string]: string } } = {};
    const existingPartition = isExistingPartition(partition?.partitionId);
    const isScheduledForRemoval = removedPartitions?.includes(
      partition.partitionId.toString()
    );

    //only items not in the remove operation will pass
    if (!isScheduledForRemoval) {
      //only items that don't already exist in the tree will pass
      if (!existingPartition) {
        //determine what the case_value of the node should be
        if (partition?.brand.length > 0) {
          caseValue = { product_brand: { value: partition?.brand.join("") } };
        } else if (partition?.productType.length > 0) {
          caseValue = {
            product_type: {
              value: partition?.productType.join(""),
              level: "LEVEL1",
            },
          };
        } else if (partition?.productId.length > 0) {
          caseValue = {
            product_item_id: { value: partition?.productId.join("") },
          };
        }

        //create resource with temp id, decrement for each possible partition
        const criterionResourceOperation = ResourceNames.adGroupCriterion(
          customer,
          adGroupId,
          tempId
        );
        tempId--;

        //create parent resource
        let parentAdGroupCriterion;
        // if we will subdivide in the end, pass the parents tempId
        if (createSubdivision) {
          parentAdGroupCriterion = ResourceNames.adGroupCriterion(
            customer,
            adGroupId,
            -1
          );
        } else {
          //otherwise keep it's parentId
          parentAdGroupCriterion = ResourceNames.adGroupCriterion(
            customer,
            adGroupId,
            Number(partition?.parentId)
          );
        }

        //partition object with set cpc, but can be changed for user.
        const newPartition = new resources.AdGroupCriterion({
          ad_group: `customers/${customer}/adGroups/${adGroupId}`,
          resource_name: criterionResourceOperation,
          cpc_bid_micros: toMicros(0.4),
          negative: false,
          status: enums.AdGroupCriterionStatus.ENABLED,
          listing_group: {
            parent_ad_group_criterion: parentAdGroupCriterion,
            type: enums.ListingGroupType.UNIT,
            case_value: caseValue,
          },
        });

        //finalize for operation
        const addPartitionNodes: MutateOperation<resources.IAdGroupCriterion> =
          {
            entity: "ad_group_criterion",
            operation: "create",
            resource: newPartition,
          };

        //push for batch operation
        addPartitionOperation.push(addPartitionNodes);
      }
    }
  });
};
