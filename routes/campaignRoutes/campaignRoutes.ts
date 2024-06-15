import { Router } from "express";

//campaignActions
import campaignStatusUpdate from "../../controllers/campaigns/campaignActions/campaign-status-update";
import createAlphaBeta from "../../controllers/campaigns/campaignActions/create-alpha-beta";
import createCampaign from "../../controllers/campaigns/campaignActions/create-campaign";
import createThreeTier from "../../controllers/campaigns/campaignActions/create-three-tier";
import deleteCampaign from "../../controllers/campaigns/campaignActions/delete-campaign";

const router = Router();

router.post("/campaign-status-update", campaignStatusUpdate);
router.post("/create-alpha-beta", createAlphaBeta);
router.post("/create-campaign", createCampaign);
router.post("/create-three-tier", createThreeTier);
router.post("/delete-campaign", deleteCampaign);

export default router;
