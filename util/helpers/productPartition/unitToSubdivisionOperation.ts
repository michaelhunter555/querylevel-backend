import {
  enums,
  MutateOperation,
  ResourceNames,
  resources,
  toMicros,
} from "google-ads-api";

import { AdGroupCriterionResource, CriterionData } from "../../../types";
import { determineSubdivisionCaseValues } from "./determineCaseValue";

/**
 * @name: unitToSubdivisionOperation
 * @description: converts a UNIT node to a SUBDIVISION node and pushes added partitions to mutate operation array, creates subdivision if necessary.
 * @conditions - partition operation contains children nodes of the (selected) UNIT node.
 */
export const unitToSubdivisionOperation = (
  customer: string,
  adGroupId: number,
  adGroupResource: string,
  partitionData: CriterionData[],
  selectedNode: AdGroupCriterionResource,
  createSubdivisionOperation: MutateOperation<resources.IAdGroupCriterion>[]
) => {
  //parent resource of selected node
  const parentNode = selectedNode?.listing_group?.parent_ad_group_criterion;

  //temp ids
  const tempSubdivision = -1;
  const tempEverythingElse = -2;

  //create temp resource names
  const tempSubdivisionResource = ResourceNames.adGroupCriterion(
    customer,
    adGroupId,
    tempSubdivision
  );
  const everythingElseResource = ResourceNames.adGroupCriterion(
    customer,
    adGroupId,
    tempEverythingElse
  );

  //determe case_values for new subdivision & 'others' nodes
  const createCaseValue = determineSubdivisionCaseValues(
    partitionData,
    selectedNode
  );

  //create new subdivision node with consideration to the root node
  const updateSelectedNodeType = new resources.AdGroupCriterion({
    resource_name: tempSubdivisionResource,
    ad_group: adGroupResource,
    listing_group: {
      type: enums.ListingGroupType.SUBDIVISION,
      //check if root node
      ...(parentNode
        ? {
            parent_ad_group_criterion: parentNode,
            case_value: createCaseValue.subdividedNodeCaseValue,
          }
        : {}),
    },
    negative: false,
    status: enums.AdGroupCriterionStatus.ENABLED,
  });

  //others node
  const everythingElseNode = new resources.AdGroupCriterion({
    resource_name: everythingElseResource,
    ad_group: adGroupResource,
    cpc_bid_micros: toMicros(0.4),
    listing_group: {
      parent_ad_group_criterion: tempSubdivisionResource,
      type: enums.ListingGroupType.UNIT,
      case_value: createCaseValue.everythingElseCaseValue,
    },
    negative: false,
    status: enums.AdGroupCriterionStatus.ENABLED,
  });

  //prepare subdivision for operation -> should be at index 0
  const updatePartitionToSubdivision: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ...updateSelectedNodeType,
      },
    };
  //push into operation array
  createSubdivisionOperation.push(updatePartitionToSubdivision);

  //prepare 'others' for operation -> should be at index 1
  const createEverythingElseNodeOperation: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ...everythingElseNode,
      },
    };
  //push into operation array
  createSubdivisionOperation.push(createEverythingElseNodeOperation);
};
