import { Request, Response } from "express";
import { enums, errors, MutateOperation, resources } from "google-ads-api";

import { createShoppingAdGroupAdResource } from "../../../lib/adGroupAdResource/shoppingAdGroupAd";
import { createAdGroupResource } from "../../../lib/adGroupResource/adGroupResource";
import { createTargetRoasStrategy } from "../../../lib/BiddingStrategy/createTargetRoasStrategy";
import { createCampaignBudget } from "../../../lib/budgetResource/createBudgetResource";
import { addNegativeKeywordsCriterionByMatchType } from "../../../lib/campaignKeywordCriterion/addNegativeKeywordCriterionByMatchType";
import { createShoppingCampaign } from "../../../lib/campaignResource/createShoppingCampaign";
import { geoTargetConstant } from "../../../lib/geoTargetConstants/geoTargetConstants";
import { geoTargetService } from "../../../lib/geoTargetConstants/geoTargetService";
import { getClient } from "../../../lib/getClient";
import { createProductInventoryFilter } from "../../../lib/InventoryFilter/inventoryFilter";
import { createRootShoppingNode } from "../../../lib/partitionNodes/filteredPartitionNode";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../../util/helpers/getMerchantCenterId";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { campaignData, budgetData } = req.body;
  //console.log("CampaignData", campaignData);

  const user = await findGoogleAuthById(id as string, res);
  //decrypt refresh token and client id
  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  //get merchant center id
  const merchantCenterId = await getMerchantCenterId(
    decryptedRefreshToken,
    decryptedAccountId
  );

  //set budget
  const budget = createCampaignBudget(
    customer.credentials.customer_id,
    budgetData
  );

  //check if new or existing Bidding Strategy
  //just provide one solid boolean value to determine instead of properties
  let newBiddingStrategy;
  const isTargetRoas =
    campaignData?.biddingStrategyType === enums.BiddingStrategyType.TARGET_ROAS;

  if (isTargetRoas && campaignData?.isNewPortfolioStrategy) {
    newBiddingStrategy = createTargetRoasStrategy(
      customer.credentials.customer_id,
      campaignData.newPortfolioStrategyName,
      campaignData.targetRoasValue
    );
  }

  let targetRoasBiddingStrategy;
  if (isTargetRoas && campaignData?.isExistingPortfolioStrategy) {
    targetRoasBiddingStrategy = `customers/${customer.credentials.customer_id}/biddingStrategies/${campaignData?.targetRoasStrategyId}`;
  }

  const assignBiddingStrategy =
    newBiddingStrategy?.resource_name || targetRoasBiddingStrategy || "";
  //set campaign data
  const shoppingCampaign = createShoppingCampaign(
    customer.credentials.customer_id,
    merchantCenterId as number,
    budget.resource_name as resources.ICampaignBudget,
    campaignData,
    assignBiddingStrategy
  );

  //campaignCriterion - Locations, ad schedule & Negative Keywords
  const targetedLocations = geoTargetConstant(
    campaignData.targetedLocations,
    false
  );

  const excludedLocations = geoTargetConstant(
    campaignData.excludedLocations,
    true
  );

  //list of negative keywords
  //need to create function to figure keyword types
  const negativeKeywords = [...campaignData.negativeKeywords];

  const campaignCriterionData: MutateOperation<resources.ICampaignCriterion>[] =
    [];

  //console.log("Criterion Data", campaignCriterionData);
  //perform services if user included in creation
  if (targetedLocations.length > 0) {
    geoTargetService(
      customer?.credentials?.customer_id,
      targetedLocations,
      0,
      campaignCriterionData
    );
  }

  if (excludedLocations.length > 0) {
    geoTargetService(
      customer?.credentials?.customer_id,
      excludedLocations,
      0,
      campaignCriterionData
    );
  }

  if (negativeKeywords.length > 0) {
    addNegativeKeywordsCriterionByMatchType(
      customer?.credentials?.customer_id,
      negativeKeywords,
      campaignCriterionData
    );
  }

  if (campaignData?.inventoryFilters) {
    createProductInventoryFilter(
      customer?.credentials?.customer_id,
      1,
      campaignCriterionData,
      campaignData?.inventoryFilters
    );
  }

  const createAdGroup = createAdGroupResource(
    customer?.credentials?.customer_id,
    0,
    campaignData?.priority,
    campaignData.name,
    campaignData.costPerClick,
    campaignData.biddingStrategyType === enums.BiddingStrategyType.TARGET_ROAS
  );

  const createAdGroupOperation: MutateOperation<resources.IAdGroup> = {
    entity: "ad_group",
    operation: "create",
    resource: createAdGroup,
  };

  const createAdGroupAd = createShoppingAdGroupAdResource(
    customer?.credentials?.customer_id,
    0
  );

  const adGroupAdShoppingOperation: MutateOperation<resources.IAdGroupAd> = {
    entity: "ad_group_ad",
    operation: "create",
    resource: createAdGroupAd,
  };

  let productCriterionOptions: MutateOperation<resources.IAdGroupCriterion>[] =
    [];

  //temp id for resource creation
  const rootTempId = -20;
  //const everythingElseTempId = -200;

  //root node for shopping campaign
  const rootNode = createRootShoppingNode(
    customer?.credentials?.customer_id,
    rootTempId,
    campaignData.costPerClick,
    campaignData.biddingStrategyType === enums.BiddingStrategyType.TARGET_ROAS
  );
  const rootNodeOperation: MutateOperation<resources.IAdGroupCriterion> = {
    entity: "ad_group_criterion",
    operation: "create",
    resource: rootNode,
  };
  productCriterionOptions.push(rootNodeOperation);

  //everyting else in all products
  // const everythingElseNode = createEverythingElseShoppingNode(
  //   customer?.credentials?.customer_id,
  //   everythingElseTempId,
  //   campaignData.costPerClick,
  //   rootNode.resource_name as string,
  //   campaignData.biddingStrategyType === enums.BiddingStrategyType.TARGET_ROAS
  // );

  // const othersOperation: MutateOperation<resources.IAdGroupCriterion> = {
  //   entity: "ad_group_criterion",
  //   operation: "create",
  //   resource: everythingElseNode,
  // };

  // productCriterionOptions.push(othersOperation);

  //prepare final data for mutation operation
  let createCampaign: MutateOperation<
    | resources.ICampaignBudget
    | resources.ICampaign
    | resources.ICampaignCriterion
    | resources.IAdGroup
    | resources.IAdGroupAd
    | resources.IAdGroupCriterion
    | resources.IBiddingStrategy
  >[] = [
    { entity: "campaign_budget", operation: "create", resource: budget },
    { entity: "campaign", operation: "create", resource: shoppingCampaign },
    ...campaignCriterionData,
    createAdGroupOperation,
    adGroupAdShoppingOperation,
    ...productCriterionOptions,
  ];

  //biddingStrategy
  if (isTargetRoas && campaignData?.isNewPortfolioStrategy) {
    const createBiddingStrategyOperation: MutateOperation<resources.IBiddingStrategy> =
      {
        entity: "bidding_strategy",
        operation: "create",
        resource: newBiddingStrategy as resources.IBiddingStrategy,
      };

    createCampaign = [
      { entity: "campaign_budget", operation: "create", resource: budget },
      createBiddingStrategyOperation,
      { entity: "campaign", operation: "create", resource: shoppingCampaign },
      ...campaignCriterionData,
      createAdGroupOperation,
      adGroupAdShoppingOperation,
      ...productCriterionOptions,
    ];
  }

  try {
    await customer.mutateResources(createCampaign);
    //console.log("Successfully Created Campaign.");
    res
      .status(201)
      .json({ message: "Campaign created successfully.", ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res.status(500).json({ message: "Failed to create Campaign." });
  }
}
