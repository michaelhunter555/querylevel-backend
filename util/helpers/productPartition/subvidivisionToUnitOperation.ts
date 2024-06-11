import {
  Customer,
  enums,
  MutateOperation,
  ResourceNames,
  resources,
  toMicros,
} from "google-ads-api";

import { AdGroupCriterionResource } from "../../../types";
import { SubdivisionToUnitCaseValue } from "./determineCaseValue";

//if all the children for the selectedNodeId === the length the removeOperation
// then we know that the parentNode no longer has any children and should be converted to a UNIT node.
// [1,2,3,4,5,6,7] in removeOp and sends []
// [1,2,3,4] currently exist in the tree
// we will only push ids that are in the currently exist so [1,2,3,4]
// then we can compare the current product group length to the removal length
//if equal, the parent has no more children, and we need to remove it.
/**
 * @name: subdivisionToUnitOperation
 * @description: operation to convert a subdivision to unit i.e. no children after removal
 * @conditions - SelectedNode has childnodes && removedPartitions length === totalAvailable children length
 * @helpers - SubdivisionTouUnitCaseValue
 */
export const subdivisionToUnitOperation = (
  customer: Customer,
  adGroupResource: string,
  adGroupId: number,
  selectedNode: AdGroupCriterionResource,
  createUnitOperation: MutateOperation<resources.IAdGroupCriterion>[],
  removePartitionsOperation: string[]
) => {
  //we need to remove the node first and recreate it
  removePartitionsOperation.push(selectedNode.AdGroupCriterionResource);

  //create new partition with tempid
  const tempResource = ResourceNames.adGroupCriterion(
    customer?.credentials?.customer_id,
    adGroupId,
    -1
  );
  const nodeParentResource =
    selectedNode?.listing_group?.parent_ad_group_criterion;

  //determine case_value
  const caseValue = SubdivisionToUnitCaseValue(selectedNode);

  //create new node accounting for root node possibilities
  const updateSelectedNodeType = new resources.AdGroupCriterion({
    resource_name: tempResource,
    ad_group: adGroupResource,
    cpc_bid_micros: toMicros(0.4),
    listing_group: {
      type: enums.ListingGroupType.UNIT,
      ...(caseValue !== null
        ? {
            parent_ad_group_criterion: nodeParentResource,
            case_value: caseValue,
          }
        : {}),
    },
    negative: false,
    status: enums.AdGroupCriterionStatus.ENABLED,
  });

  //prepare for operation
  const updateSubvidisionToUnit: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ...updateSelectedNodeType,
      },
    };
  //push into operation array
  createUnitOperation.push(updateSubvidisionToUnit);
};
