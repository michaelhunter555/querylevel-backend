import { Response } from 'express';
import {
  errors,
  MutateOperation,
  resources,
} from 'google-ads-api';

import { googleError } from '../googleError';

/**
 * @name: mutateAddandOrUpdatePartition
 * @description: Mutate operation to add partitions to productGroupView - will also update the partition to subdivision if necessary
 * @conditions if createSubdivisionOperation has length > 0, combine with addPartitionOperation.
 * if only addPartitionOperation has length > 0 do that || or nothing.
 */
export const mutateAddAndOrUpdatePartition = async (
  customer: any,
  res: Response,
  createSubdivisionOperation: MutateOperation<resources.IAdGroupCriterion>[],
  addPartitionOperation: MutateOperation<resources.IAdGroupCriterion>[]
) => {
  //arrange operation
  let partitionMutationOperation: MutateOperation<resources.IAdGroupCriterion>[];
  //if there is a node in the subdivision operation, then it means we need to create a subdivision to handle children
  // this also means we already removed the UNIT node
  if (createSubdivisionOperation.length > 0) {
    partitionMutationOperation = [
      ...createSubdivisionOperation,
      ...addPartitionOperation,
    ];

    console.log("operation before mutation", partitionMutationOperation);

    try {
      await customer.mutateResources(partitionMutationOperation);
      res.status(200).json({ message: "Success", ok: true });
      console.log("Operation Success! Subdivision created");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ message: "Error while creating new partition", ok: false });
    }
    //if we are already working with a subdivision, we can just determine if we need to add anything
  } else if (addPartitionOperation.length > 0) {
    partitionMutationOperation = [...addPartitionOperation];
    //console.log("final form", partitionMutationOperation);
    try {
      await customer.mutateResources(partitionMutationOperation);
      res.status(200).json({ message: "Success", ok: true });
      console.log("Operation Success!: partitions added");
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ message: "Error while creating new partition", ok: true });
    }
  }
};
