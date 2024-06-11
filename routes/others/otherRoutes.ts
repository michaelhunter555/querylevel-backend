import { Router } from "express";

import getAppAnalytics from "../../controllers/others/get-app-analytics";
import getCampaignAdSchedule from "../../controllers/others/get-campaign-ad-schedule";
import getCampaignNames from "../../controllers/others/get-campaign-names";
import getConversionData from "../../controllers/others/get-conversion-data"; //update this on client as well
import getEditableCampaign from "../../controllers/others/get-editable-campaign";
import getListingScope from "../../controllers/others/get-listing-scope";
import getMerchantCenterId from "../../controllers/others/get-merchant-center-id";
import getNegativeKeywords from "../../controllers/others/get-negative-keywords";
import getPortfolioStrategies from "../../controllers/others/get-portfolio-strategies";
import getResourceNames from "../../controllers/others/get-resource-names";
import getSharedBudgets from "../../controllers/others/get-shared-budgets";
import getTargetedGeoConstants from "../../controllers/others/get-targeted-geo-constants";
import getUSStatesQuery from "../../controllers/others/get-us-states-query";
import getMerchantsBrandsData from "../../controllers/others/getMerchantsBrandsData";
import getMerchantsProductsData from "../../controllers/others/getMerchantsProductsData";
import getUserAdGroups from "../../controllers/others/getUserAdGroups";
import getUserCampaigns from "../../controllers/others/getUserCampaigns";
import inventoryFilter from "../../controllers/others/inventory-filter";
import toggleTheme from "../../controllers/others/toggle-theme";

const router = Router();

router.get("/get-app-analytics", getAppAnalytics);
router.get("/get-campaign-ad-schedule", getCampaignAdSchedule);
router.get("/get-campaign-names", getCampaignNames);
router.get("/get-conversion-data", getConversionData);
router.get("/get-editable-campaign", getEditableCampaign);
router.get("/get-listing-scope", getListingScope);
router.get("/get-merchant-center-id", getMerchantCenterId);
router.get("/get-negative-keywords", getNegativeKeywords);
router.get("/get-portfolio-strategies", getPortfolioStrategies);
router.get("/get-resource-names", getResourceNames);
router.get("/get-shared-budgets", getSharedBudgets);
router.get("/get-targeted-geo-constants", getTargetedGeoConstants);
router.get("/get-us-states-query", getUSStatesQuery);
router.get("/getMerchantsBrandsData", getMerchantsBrandsData);
router.get("/getMerchantsProductsData", getMerchantsProductsData);
router.get("/getUserAdGroups", getUserAdGroups);
router.get("/getUserCampaigns", getUserCampaigns);
router.get("/inventory-filter", inventoryFilter);

//post
router.post("/toggle-theme", toggleTheme);

export default router;
