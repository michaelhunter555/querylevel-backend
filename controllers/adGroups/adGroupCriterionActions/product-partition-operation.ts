import { Request, Response } from "express";
import { enums, MutateOperation, resources } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { addProductPartitionsOperation } from "../../../util/helpers/productPartition/addProductPartitionOperation";
import { mutateAddAndOrUpdatePartition } from "../../../util/helpers/productPartition/executeAddAndOrUpdatePartition";
import { mutateRemovalAndOrUpdatePartition } from "../../../util/helpers/productPartition/executeRemovalAndOrUpdatePartition";
import { getProductTreeForPartitionOperation } from "../../../util/helpers/productPartition/getProductTreeForPartitionOperation";
import { prepareRemoveOperation } from "../../../util/helpers/productPartition/removePartitionsOperation";
import { subdivisionToUnitOperation } from "../../../util/helpers/productPartition/subvidivisionToUnitOperation";
import { unitToSubdivisionOperation } from "../../../util/helpers/productPartition/unitToSubdivisionOperation";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { selectedNode, partitionData, adGroupResource, removedPartitions } =
    req.body;

  //retrieve tokens and google id to access api
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  //key variables needed in our operation
  const customerId = customer.credentials.customer_id;
  const adGroupId = Number(adGroupResource.split("/")[3]);

  //possible operations
  // add new partitions to tree
  const addPartitionOperation: MutateOperation<resources.IAdGroupCriterion>[] =
    [];
  // update selected node to subdivision
  const createSubdivisionOperation: MutateOperation<resources.IAdGroupCriterion>[] =
    [];
  // update selected node to unit
  const createUnitOperation: MutateOperation<resources.IAdGroupCriterion>[] =
    [];
  // remove partitions from tree
  const removePartitionsOperation: string[] = [];

  //get current product group tree
  const result = await getProductTreeForPartitionOperation(customer, adGroupId);
  const resultMap = new Map();

  //store each id alongside its partition object
  result?.forEach((partition) => {
    const id = partition?.ad_group_criterion?.criterion_id;
    resultMap.set(id, partition);
  });

  //helper to find if partition is in active tree
  const isExistingPartition = (id: number) => {
    return resultMap.has(Number(id));
  };

  // check if there are any removed ids
  if (removedPartitions.length > 0) {
    //perform removal check
    prepareRemoveOperation(
      customerId,
      adGroupId,
      removedPartitions,
      removePartitionsOperation,
      isExistingPartition
    );

    if (
      //user sends empty form meaning remove all partitions
      //node should be a subdivision already to convert it back to unit
      partitionData?.length === 0 &&
      selectedNode?.listing_group?.type === enums.ListingGroupType.SUBDIVISION
    ) {
      //if all the children for the selectedNodeId === the length the removeOperation
      // then we know that the parentNode no longer has any children and should be converted to a UNIT node.
      subdivisionToUnitOperation(
        customer,
        adGroupResource,
        adGroupId,
        selectedNode,
        createUnitOperation,
        removePartitionsOperation
      );
    }
  }

  //check all partitions for new additions
  //create a subdivision if we are subdividing a UNIT
  let createSubdivision: boolean = false;
  let tempId = -3;
  if (partitionData.length > 0) {
    //The selectedNode may become a parent of the partitions operations
    //flag for a subdivision operation if partition is a UNIT node.
    const partitionIsUnit =
      selectedNode?.listing_group?.type === enums.ListingGroupType.UNIT;
    if (partitionIsUnit) {
      createSubdivision = true;
      // partitions are immutatable, so delete the current one by pushing into remove operation
      removePartitionsOperation.push(selectedNode?.AdGroupCriterionResource);
    }

    //add all partitions not in remove operation and not already existing in the tree
    addProductPartitionsOperation(
      customer.credentials?.customer_id,
      adGroupId,
      tempId,
      createSubdivision,
      partitionData,
      removedPartitions,
      addPartitionOperation,
      isExistingPartition
    );
  }

  //REMOVE designated partions and update if no children left
  await mutateRemovalAndOrUpdatePartition(
    customer,
    addPartitionOperation,
    removePartitionsOperation,
    createUnitOperation,
    res
  );

  //check if we need to update the current partition to subdivision
  //should not run if unit is not being subdivided
  if (createSubdivision) {
    //("LINE 159 - OPEERATION DID BEGIN:");
    //convert the unit to a subdivision
    unitToSubdivisionOperation(
      customer.credentials.customer_id,
      adGroupId,
      adGroupResource,
      partitionData,
      selectedNode,
      createSubdivisionOperation
    );
  }

  //ADD if there is a node in the subdivision operation, then it means we need to create a subdivision to handle children
  await mutateAddAndOrUpdatePartition(
    customer,
    res,
    createSubdivisionOperation,
    addPartitionOperation
  );
}
