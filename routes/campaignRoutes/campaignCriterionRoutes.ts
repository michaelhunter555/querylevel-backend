import { Router } from "express";

import addNegativeKeywords from "../../controllers/campaigns/campaignCriterionActions/add-negative-keywords";
import addNewNegativeKeywords from "../../controllers/campaigns/campaignCriterionActions/add-new-negative-keywords";
import bulkEditCampaignCriterionMatchType from "../../controllers/campaigns/campaignCriterionActions/bulk-edit-campaign-criterion-match-type";
import bulkRemoveCampaignCriterionNegativeKeywords from "../../controllers/campaigns/campaignCriterionActions/bulk-remove-campaign-criterion-keyword";
import editGeoTargetingConstants from "../../controllers/campaigns/campaignCriterionActions/edit-geo-targeting-constants";
import editNegativeKeywords from "../../controllers/campaigns/campaignCriterionActions/edit-negative-keywords";
import updateAdSchedule from "../../controllers/campaigns/campaignCriterionActions/update-ad-schedule";
import updateInventoryFilter from "../../controllers/campaigns/campaignCriterionActions/update-inventory-filter";

const router = Router();

router.post("/add-negative-keywords", addNegativeKeywords);
router.post("/add-new-negative-keywords", addNewNegativeKeywords);
router.post(
  "/bulk-edit-campaign-criterion-match-type",
  bulkEditCampaignCriterionMatchType
);
router.post(
  "/bulk-remove-campaign-criterion-negative-keywords",
  bulkRemoveCampaignCriterionNegativeKeywords
);
router.post("/edit-geo-targeting-constants", editGeoTargetingConstants);
router.post("/edit-negative-keywords", editNegativeKeywords);
router.post("/update-ad-schedule", updateAdSchedule);
router.post("/update-inventory-filter", updateInventoryFilter);

export default router;
