import { Response } from 'express';
import {
  common,
  Customer,
  enums,
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  toMicros,
} from 'google-ads-api';

import { AdGroupCriterionResource } from '../../../types';
import { googleError } from '../googleError';

type ProductGroupView = {
  ad_group_criterion: AdGroupCriterion;
};

type AdGroupCriterion = {
  criterion_id: number;
  cpc_bid_micros: number;
  status: number;
  negative: boolean;
  listing_group: {
    parent_ad_group_criterion: string | null;
    case_value: common.ListingDimensionInfo;
    type: number;
  };
};

type CaseValue = {
  [key: string]: { [key: string]: string | null | undefined } | undefined;
};

/**
 * @name - targetExcludeUnitOperation - for UNIT partitions target & exclusion
 * @param customer - customer resource
 * @param selectedNode - partition object for row user clicks on
 * @param wasNull - boolean check based on current negative status for cpc_micros
 * @param cpcBid - number bid user inputs
 * @param tempResource - temp adGroupCriterion resource name for create operation
 * @param res - Next API response
 */
export const targetExcludeUnitOperation = async (
  customer: Customer,
  selectedNode: AdGroupCriterionResource,
  wasNull: boolean,
  cpcBid: number,
  tempResource: string,
  res: Response
) => {
  console.log(" I RAN MOFO");
  //create new partition resource with tempId
  const newPartition = new resources.AdGroupCriterion({
    resource_name: tempResource,
    ad_group: selectedNode?.adGroupResource,
    cpc_bid_micros: wasNull ? toMicros(cpcBid) : null, // if true -> need to add cpc | if false -> now its null
    status: selectedNode?.status,
    negative: !selectedNode?.negative, //updated negative to opposite
    listing_group: {
      type: selectedNode?.listing_group?.type,
      parent_ad_group_criterion:
        selectedNode?.listing_group?.parent_ad_group_criterion,
      case_value: {
        ...selectedNode?.listing_group?.case_value,
      },
    },
  });

  //prepare for create operation
  const createUpdatedPartitionOperation: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ...newPartition,
      },
    };

  //remove node
  try {
    await customer.adGroupCriteria.remove([
      selectedNode?.AdGroupCriterionResource,
    ]);
    //create node again
    await customer.mutateResources([createUpdatedPartitionOperation]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ ok: false });
  }
};

/**
 * @name - targetExcludeSubdivisionOperation - for 'others' case target and exclusion - goes 2 levels. follows settings of app by brand -> item_id only
 * @param customer - customer resource
 * @param selectedNode - partition object for row user clicks on
 * @param wasNull - boolean check based on current negative status for cpc_micros
 * @param cpcBid - number bid user inputs
 * @param tempRootResource - temp subdivided adGroupCriterion resource name for create operation
 * @param tempOthersResource - temp 'others' adGroupCriterion resource name for create operation
 * @param res - Next API response
 */
export const targetExcludeSubdivisionOperation = async (
  customer: Customer,
  selectedNode: AdGroupCriterionResource,
  wasNull: boolean, //for cpc_bid
  cpcBid: number, // new cpc_bid
  tempRootResource: string,
  tempOthersResource: string,
  res: Response
) => {
  //adGroup id
  const adGroupId = Number(selectedNode?.adGroupResource.split("/")[3]);
  //where we will re-create our current tree
  let cloneProductTreeOperation: MutateOperation<resources.IAdGroupCriterion>[] =
    [];
  //partition ids we need to delete
  let removeChildIds: string[] = [];

  //get current product_group_tree
  const query = `
  SELECT
  ad_group_criterion.criterion_id,
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.status,
  ad_group_criterion.negative,
  ad_group_criterion.listing_group.type,
  ad_group_criterion.listing_group.parent_ad_group_criterion,
  ad_group_criterion.listing_group.case_value.product_brand.value,
  ad_group_criterion.listing_group.case_value.product_type.value,
  ad_group_criterion.listing_group.case_value.product_item_id.value,
  ad_group.id
  FROM product_group_view
  WHERE ad_group.id = '${adGroupId}'
  `;

  //create map to track partition by id
  let resultMap = new Map();
  let result: ProductGroupView[] = [];
  try {
    result = await customer.query(query);
    result.forEach((partition: ProductGroupView) => {
      const id = partition?.ad_group_criterion?.criterion_id;
      if (!resultMap.has(id)) {
        resultMap.set(id, partition);
      }
    });
  } catch (err) {
    console.log(err);
  }

  /**
   *
   * @param nodeId - number - ad_group_criterion.criterion_id
   * @returns true if selectedNode
   * @purpose - to identify selectedNode during 'create' mutations
   */
  const isSelectedNode = (nodeId: number): boolean => {
    return selectedNode?.criterion_id === nodeId;
  };

  //start tempIds at -3  since subdivision and others will be -1 and -2
  let tempChildId = -3;
  //the parentId of the selectedNode (everythingelse node) => criterion_id: number
  let selectedEverythingElseParentId: number | null;
  //the parent resource_name for the selectedNode's parent node => customers/{customerid}/adGroupCriteria/{adgroupid}~{criterionId}
  let subdividedParentResource: string | null = "";
  //the case_value for the selectedNode's parent node
  let parentNodeCaseValue: CaseValue = {};

  //LOOP 1 BEGINS
  if (result && result.length > 0) {
    result?.forEach((partition: ProductGroupView, i: number) => {
      // console.log(`Started First Loop LINE 180 ${i}`);
      //id of partition
      const nodeId = partition?.ad_group_criterion?.criterion_id;

      //parent id of partition
      const parentId =
        partition?.ad_group_criterion?.listing_group?.parent_ad_group_criterion
          ?.split("~")
          .pop();

      //selectedNode (everythingelse node) parent id - parentId of the 'others' node
      const selectedNodeParent =
        selectedNode?.listing_group?.parent_ad_group_criterion
          ?.split("~")
          .pop();

      //find parent partition of selected 'others' node
      // IF CHECK - LOOP 1
      if (Number(selectedNodeParent) === Number(nodeId)) {
        // console.log("Found Parent Partition at line 200", `${i}`);
        //ROOT Subdivision ID
        selectedEverythingElseParentId = nodeId;
        //get selectedNode (everythingelse node) parent partition object
        const getParentPartitionInfo = resultMap.get(
          selectedEverythingElseParentId
        );

        if (getParentPartitionInfo) {
          // console.log("Retrieved parentPartition object", `${i}`);
          //find parent resource
          const parentResource =
            getParentPartitionInfo?.ad_group_criterion?.listing_group
              ?.parent_ad_group_criterion;

          //if root node, resource will be null. Otherwise, resource should be available
          subdividedParentResource = parentResource ? parentResource : null;

          //store it's case_value
          parentNodeCaseValue =
            getParentPartitionInfo?.ad_group_criterion?.listing_group
              ?.case_value;
        }
      }
      //only re-add children of the subdivision
      //string === string comparison
      //check which partitions in the tree have the same parentId/resource as the 'others' case
      //STILL IN LOOP 1
      if (parentId === selectedNodeParent) {
        // console.log("ParentId equals the same as selected others", `${i}`);
        //remove partitions
        const childPartitionResource = ResourceNames.adGroupCriterion(
          customer.credentials.customer_id,
          adGroupId,
          partition?.ad_group_criterion?.criterion_id
        );

        removeChildIds.push(childPartitionResource);

        //create new temp resource for child - tempChildId(starts at -3)
        const tempChildResource = ResourceNames.adGroupCriterion(
          customer.credentials.customer_id,
          adGroupId,
          tempChildId
        );
        //skip the node that we selected because we are creating it manually outside of this loop
        const shouldSkipNode = isSelectedNode(
          partition?.ad_group_criterion?.criterion_id
        );
        //only create a new resource if it's not the selectedNode
        if (!shouldSkipNode) {
          // console.log("Checking all nodes except the Selected Node", `${i}`);
          //we skip ev-else (selectedNode) because we create it manually.
          //we also re-create 2 nodes in the operation that exist in the current tree (if subdivided deeper)
          // that is childsubdivision node and child subdividision 'others' node.
          //check if the child node is a subdivision and also has children
          //level 2 nodes
          let childSubdivisionId: number = 0;
          let isAChildSubdivision: resources.AdGroupCriterion;
          let isAChildOthersCase: resources.AdGroupCriterion;
          let grandChildrenPartition: number[] = [];
          //check if any nodes are subdivisions - if so find their children - specifically the 'others' case
          // create operations for subdivided node && 'others' case
          // remove both ids
          // loop over to find unit nodes
          // if false, this does not run - nor is an additonal loop made.
          if (
            partition?.ad_group_criterion?.listing_group?.type ===
              enums.ListingGroupType.SUBDIVISION &&
            partition?.ad_group_criterion?.listing_group?.case_value
              ?.product_brand?.value
          ) {
            //get id of that node // should have been pushed to remove array in first loop
            childSubdivisionId = partition?.ad_group_criterion?.criterion_id;
            grandChildrenPartition.push(childSubdivisionId);

            //create a new resource for it
            isAChildSubdivision = new resources.AdGroupCriterion({
              resource_name: tempChildResource,
              ad_group: selectedNode?.adGroupResource,
              status: partition?.ad_group_criterion?.status,
              listing_group: {
                type: partition?.ad_group_criterion?.listing_group?.type,
                parent_ad_group_criterion: tempRootResource,
                case_value: {
                  ...partition?.ad_group_criterion?.listing_group?.case_value,
                },
              },
            });
            tempChildId--;

            const createChildSubvidivision: MutateOperation<resources.IAdGroupCriterion> =
              {
                entity: "ad_group_criterion",
                operation: "create",
                resource: {
                  ...isAChildSubdivision,
                },
              };

            cloneProductTreeOperation.push(createChildSubvidivision);

            //loop over the tree again and find it's children
            let childSubdivisionOthersNode: boolean = false;
            // LOOP 2 Begins
            result.forEach((partition) => {
              const ChildtempChildResource = ResourceNames.adGroupCriterion(
                customer.credentials.customer_id,
                adGroupId,
                tempChildId
              );
              //store parentId
              let parentId =
                partition?.ad_group_criterion?.listing_group?.parent_ad_group_criterion
                  ?.split("~")
                  .pop();
              //find children
              // console.log("check befory child subdivision", `${i}`);
              if (Number(parentId) === childSubdivisionId) {
                //find the other's node and push into remove array as it shoud not be in there from 1st check
                if (
                  partition?.ad_group_criterion?.listing_group?.type ===
                  enums.ListingGroupType.UNIT
                ) {
                  //now check if it's casevalue.property.value === null
                  // Object.keys(
                  //   partition?.ad_group_criterion?.listing_group
                  //     ?.case_value || {}
                  // ).length === 0 ||
                  childSubdivisionOthersNode = !partition?.ad_group_criterion
                    ?.listing_group?.case_value?.product_item_id?.value
                    ? true
                    : false; //no value provided

                  // console.log(
                  //   "IS A ChildSubdivisionOthersNode",
                  //   childSubdivisionOthersNode
                  // );
                  // partition?.ad_group_criterion?.listing_group?.case_value
                  // ?.product_item_id?.value === null;

                  if (childSubdivisionOthersNode) {
                    //create its 'others' case // not removed in first loop, find id and add to remove operation
                    isAChildOthersCase = new resources.AdGroupCriterion({
                      resource_name: ChildtempChildResource,
                      ad_group: selectedNode?.adGroupResource,
                      cpc_bid_micros:
                        partition?.ad_group_criterion?.cpc_bid_micros,
                      status: partition?.ad_group_criterion?.status,
                      negative: partition?.ad_group_criterion?.negative,
                      listing_group: {
                        type: enums.ListingGroupType.UNIT,
                        parent_ad_group_criterion: tempChildResource,
                        case_value: {
                          product_item_id: {},
                        },
                      },
                    });
                    tempChildId--;

                    const isAChildOthersCaseOperation: MutateOperation<resources.IAdGroupCriterion> =
                      {
                        entity: "ad_group_criterion",
                        operation: "create",
                        resource: {
                          ...isAChildOthersCase,
                        },
                      };

                    cloneProductTreeOperation.push(isAChildOthersCaseOperation);
                    grandChildrenPartition.push(
                      partition?.ad_group_criterion?.criterion_id
                    );
                  }
                }

                //create subdivided children nodes
                if (!childSubdivisionOthersNode) {
                  //keep track of grandchildren// maybe use a Set() in future? - to avoid duplicates
                  grandChildrenPartition.push(
                    partition?.ad_group_criterion?.criterion_id
                  );
                  // console.log("created grandchild", `${i}`);

                  const createSubdividedChildPartitions =
                    new resources.AdGroupCriterion({
                      resource_name: ChildtempChildResource,
                      ad_group: selectedNode?.adGroupResource,
                      cpc_bid_micros:
                        partition?.ad_group_criterion?.cpc_bid_micros,
                      status: partition?.ad_group_criterion?.status,
                      negative: partition?.ad_group_criterion?.negative,
                      listing_group: {
                        type: partition?.ad_group_criterion?.listing_group
                          ?.type,
                        parent_ad_group_criterion: tempChildResource,
                        case_value: {
                          ...partition?.ad_group_criterion?.listing_group
                            ?.case_value,
                        },
                      },
                    });
                  tempChildId--;

                  //prepare for mutate operation
                  const createSubdividedChildPartitionOperation: MutateOperation<resources.IAdGroupCriterion> =
                    {
                      entity: "ad_group_criterion",
                      operation: "create",
                      resource: createSubdividedChildPartitions,
                    };

                  cloneProductTreeOperation.push(
                    createSubdividedChildPartitionOperation
                  );
                }
              }
            });
            //end of if and loop 2
          }

          //if the partition was a childSubdivision/unit -> all the ids in here are handled already...
          const isAGrandChild = grandChildrenPartition?.includes(
            partition?.ad_group_criterion?.criterion_id
          );

          const ImmediateChildrenResource = ResourceNames.adGroupCriterion(
            customer?.credentials?.customer_id,
            adGroupId,
            tempChildId
          );

          //so only UNIT nodes should be processed through here - immediate children of the selectedNodeParent (everythingelse node)
          if (!isAGrandChild) {
            //console.log("unit node children of the root node", `${i}`);
            const createChildPartitions = new resources.AdGroupCriterion({
              resource_name: ImmediateChildrenResource,
              ad_group: selectedNode?.adGroupResource,
              cpc_bid_micros: partition?.ad_group_criterion?.cpc_bid_micros,
              status: partition?.ad_group_criterion?.status,
              negative: partition?.ad_group_criterion?.negative,
              listing_group: {
                type: partition?.ad_group_criterion?.listing_group?.type,
                parent_ad_group_criterion: tempRootResource,
                case_value: {
                  ...partition?.ad_group_criterion?.listing_group?.case_value,
                },
              },
            });

            const createImmediateChildUnitOperation: MutateOperation<resources.IAdGroupCriterion> =
              {
                entity: "ad_group_criterion",
                operation: "create",
                resource: {
                  ...createChildPartitions,
                },
              };
            cloneProductTreeOperation.push(createImmediateChildUnitOperation);
          }
          //still need to account for child unit nodes that are not child subdivisions
          tempChildId--;
        }
      }
    });
    //end of if and loop
  }

  //parent partition of the 'others' node
  const subdividedNode = new resources.AdGroupCriterion({
    resource_name: tempRootResource,
    ad_group: selectedNode?.adGroupResource,
    listing_group: {
      //if root node, don't include
      ...(subdividedParentResource
        ? {
            parent_ad_group_criterion: subdividedParentResource, //root node will be null
            case_value: {
              ...parentNodeCaseValue,
            },
          }
        : {}),
      type: enums.ListingGroupType.SUBDIVISION,
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  });

  // console.log("exclude operation", subdividedNode.listing_group?.case_value);

  //new 'others' node
  const newPartition = new resources.AdGroupCriterion({
    resource_name: tempOthersResource,
    ad_group: selectedNode?.adGroupResource,
    cpc_bid_micros: wasNull ? toMicros(cpcBid) : null, // check cpc
    status: selectedNode?.status,
    negative: !selectedNode?.negative, //updated negative to opposite
    listing_group: {
      type: selectedNode?.listing_group?.type,
      parent_ad_group_criterion: tempRootResource,
      case_value: {
        ...selectedNode?.listing_group?.case_value,
      },
    },
  });

  //prepare for mutate operation at index 0
  const createSubdividedNodeOperation: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ...subdividedNode,
      },
    };

  //prepare for mutate operation at index 1
  const createUpdatedPartitionOperation: MutateOperation<resources.IAdGroupCriterion> =
    {
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ...newPartition,
      },
    };

  try {
    //remove all nodes - AdGroupCriterion.negative is immutable so this step is very necessary
    await customer.adGroupCriteria.remove([
      ...removeChildIds,
      selectedNode?.listing_group?.parent_ad_group_criterion as string,
    ]);
    //create all nodes with 'others' !negative
    await customer.mutateResources([
      createSubdividedNodeOperation,
      createUpdatedPartitionOperation,
      ...cloneProductTreeOperation,
    ]);
    //console.log("SUCCESS!");
    res.status(200).json({ ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ ok: false });
  }
};
