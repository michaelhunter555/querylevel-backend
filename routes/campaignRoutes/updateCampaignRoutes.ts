import { Router } from "express";

import updateBiddingStrategyType from "../../controllers/campaigns/updateCampaignTypes/update-bidding-strategy-type";
import updateCampaignBudget from "../../controllers/campaigns/updateCampaignTypes/update-campaign-budget";
import updateCampaignDetails from "../../controllers/campaigns/updateCampaignTypes/update-campaign-details";
import updateCampaignShoppingSettings from "../../controllers/campaigns/updateCampaignTypes/update-campaign-shopping-settings";
import updateGeoTargetSettings from "../../controllers/campaigns/updateCampaignTypes/update-geo-target-settings";
import updateLocalInventory from "../../controllers/campaigns/updateCampaignTypes/update-local-inventory";
import updateNetworkSettings from "../../controllers/campaigns/updateCampaignTypes/update-network-settings";

const router = Router();

router.post("/update-bidding-strategy-type", updateBiddingStrategyType);
router.post("/update-campaign-budget", updateCampaignBudget);
router.post("/update-campaign-details", updateCampaignDetails);
router.post(
  "/update-campaign-shopping-settings",
  updateCampaignShoppingSettings
);
router.post("/update-geo-target-settings", updateGeoTargetSettings);
router.post("/update-local-inventory", updateLocalInventory);
router.post("/update-network-settings", updateNetworkSettings);

export default router;
