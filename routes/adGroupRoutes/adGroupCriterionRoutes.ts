import { Router } from "express";

import addAdGroupCriterionNegativeKeyword from "../../controllers/adGroups/adGroupCriterionActions/add-ad-group-criterion-negative-keyword";
import addNewNegativeKeywords from "../../controllers/adGroups/adGroupCriterionActions/add-new-negative-keywords";
import bulkEditAdGroupCriterionMatchType from "../../controllers/adGroups/adGroupCriterionActions/bulk-edit-ad-group-criterion-match-type";
import bulkRemoveCriterionNegativeKeywords from "../../controllers/adGroups/adGroupCriterionActions/bulk-remove-criterion-negative-keywords";
import createRootNode from "../../controllers/adGroups/adGroupCriterionActions/create-root-node";
import editNegativeKeywords from "../../controllers/adGroups/adGroupCriterionActions/edit-negative-keywords";
import getAvailablePartitions from "../../controllers/adGroups/adGroupCriterionActions/getAvailablePartitions";
import productPartitionOperation from "../../controllers/adGroups/adGroupCriterionActions/product-partition-operation";
import targetExcludeCriterion from "../../controllers/adGroups/adGroupCriterionActions/target-exclude-criterion";
import updateCpc from "../../controllers/adGroups/adGroupCriterionActions/update-cpc";

const router = Router();

router.get("/getAvailablePartitions", getAvailablePartitions);

//adGroupCriterion keywords
router.post(
  "/add-ad-group-criterion-negative-keyword",
  addAdGroupCriterionNegativeKeyword
);
router.post("/add-new-negative-keywords", addNewNegativeKeywords);
router.post(
  "/bulk-edit-ad-group-criterion-match-type",
  bulkEditAdGroupCriterionMatchType
);
router.post(
  "/bulk-remove-criterion-negative-keywords",
  bulkRemoveCriterionNegativeKeywords
);
router.post("/edit-negative-keywords", editNegativeKeywords);

//productPartitions
router.post("/create-root-node", createRootNode);
router.post("/product-partition-operation", productPartitionOperation); //product-partition-operation
router.post("/target-exclude-criterion", targetExcludeCriterion);
router.post("/update-cpc", updateCpc);

export default router;
