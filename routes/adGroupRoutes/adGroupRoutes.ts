import { Router } from "express";

import createAdGroup from "../../controllers/adGroups/adGroupActions/create-ad-group";
import removeAdGroup from "../../controllers/adGroups/adGroupActions/remove-ad-group";
import updateAdGroupBids from "../../controllers/adGroups/adGroupActions/update-ad-group-bids";
import updateAdGroupName from "../../controllers/adGroups/adGroupActions/update-ad-group-name";
import updateAdGroupStatus from "../../controllers/adGroups/adGroupActions/update-ad-group-status";

const router = Router();

router.post("/create-ad-group", createAdGroup);
router.post("/remove-ad-group", removeAdGroup);
router.post("/update-ad-group-bids", updateAdGroupBids);
router.post("/update-ad-group-name", updateAdGroupName);
router.post("/update-ad-group-status", updateAdGroupStatus);

export default router;
