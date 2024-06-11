import { Response } from "express";
import { errors, MutateOperation, resources } from "google-ads-api";

import { googleError } from "../googleError";

/**
 * @name: mutateRemovalAndOrUpdatePartition
 * @description: operation that will perform the remove operation and/or update the partition to a UNIT and push into operation array
 * @conditions - if Subdivided children length === 0 delete node and create UNIT
 * @else runs regular removal operation if there are at least one pushed in remove operations.
 * */
export const mutateRemovalAndOrUpdatePartition = async (
  customer: any,
  addPartitionOperation: MutateOperation<resources.IAdGroupCriterion>[],
  removePartitionsOperation: string[],
  createUnitOperation: MutateOperation<resources.IAdGroupCriterion>[],
  res: Response
) => {
  //if createUnitOperation has length a subdivided node & 'others node is to be deleted
  if (removePartitionsOperation.length > 0 && createUnitOperation.length > 0) {
    try {
      await customer.adGroupCriteria.remove(removePartitionsOperation);
      await customer.mutateResources(createUnitOperation);
      //safety check to make sure addPartitions has no operations
      if (addPartitionOperation.length === 0) {
        res.status(200).json({
          message: "converted subdivision to unit complete",
          ok: true,
        });
      }
      console.log("Partitions were removed and unit created");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ error: "error converting subdivision to unit.", ok: false });
    }
    //otherwise run the regular removal operation if there are any items
  } else if (removePartitionsOperation.length > 0) {
    //console.log("REMOVE OPERATION:", removePartitionsOperation);
    try {
      await customer.adGroupCriteria.remove(removePartitionsOperation);
      console.log("Partitions were removed.");
      if (addPartitionOperation.length === 0) {
        res
          .status(200)
          .json({ message: "removed partitions complete", ok: true });
      }
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res.status(500).json({ message: "error removing partitions", ok: false });
    }
  }
};
