import { Request, Response } from "express";
import {
  enums,
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  toMicros,
} from "google-ads-api";

import { createShoppingAdGroupAdResource } from "../../../lib/adGroupAdResource/shoppingAdGroupAd";
import { createAdGroupResource } from "../../../lib/adGroupResource/adGroupResource";
import { adScheduleService } from "../../../lib/adScheduleCriteria/adScheduleService";
import { createAdSchedule } from "../../../lib/adScheduleCriteria/createAdSchedule";
import { addNegativeKeywordsCriterion } from "../../../lib/campaignKeywordCriterion/addNegativeKeywordCriterion";
import { createAlphaBetaCampaignResource } from "../../../lib/campaignResource/createAlphaBetaCampaignResource";
import { geoTargetConstant } from "../../../lib/geoTargetConstants/geoTargetConstants";
import { geoTargetService } from "../../../lib/geoTargetConstants/geoTargetService";
import { getClient } from "../../../lib/getClient";
import {
  createBrandNode,
  createEverythingElseInBrandNode,
  createEverythingElseNode,
  createProductItemIdNode,
  createRootNode,
} from "../../../lib/partitionNodes/partitionNodes";
import { ScheduleItem } from "../../../types";
import { decryptData } from "../../../util/encryption/decryptData";
import { adjustLongTitle } from "../../../util/helpers/adjustLongTitle";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../../util/helpers/getMerchantCenterId";
import { getProductIdsForBrand } from "../../../util/helpers/getProductIdForBrand";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, accountId } = req.query;
  const reqBody = req.body;
  const campaign = reqBody.campaign;

  if (!id) {
    return res.status(500).json({
      message: "No id found in request. An id must be sent in the request.",
    });
  }
  //confirm fields are valid
  if (
    campaign?.vendor.trim().length === 0 ||
    campaign?.budget === 0 ||
    campaign?.cpc === 0
  ) {
    return res.status(500).json({ message: "Please fill in all fields." });
  }

  // PHASE 1: CONNECT TO DATABASE TO GET USER INFO AND INSTANTIATE NEW GOOGLE ADS CLIENT
  /**
   * 1.1 Connect to mongoDb
   * 1.2 Instantiate new Google ads Client
   * 1.3 retrieve user data and refresh_token. Decrypt it to use with client & to retreive merchant Id.
   */

  //retrieve encrypted refresh token
  const user = await findGoogleAuthById(id as string, res);

  if (user?.createdCampaigns >= user?.campaignQuota) {
    return res.status(403).json({
      ok: false,
      message:
        "You've exceeded the plan limit. Please consider upgrading to create more tiered campaigns or wait until the start of the next billing date.",
    });
  }
  //decrypt refresh token
  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccessToken = decryptData(user.access_token);

  //get googleAdsAPi client
  const client = getClient();

  //configure client to perform operations
  const customer = client.Customer({
    customer_id: `${accountId}`,
    refresh_token: decryptedRefreshToken,
  });

  //get merchantCenterId (as merchId) to create Shopping campaigns
  let merchId: number | undefined;
  try {
    merchId = await getMerchantCenterId(
      decryptedRefreshToken,
      accountId as string
    );
  } catch (err) {
    console.log(err);
  }
  // *****END OF PHASE 1*******//

  // PHASE 2: CREATE SHARED BUDGET & THREE CAMPAIGNS
  // FOR EACH CAMPAIGN WE WILL ASSIGN A UNIQUE TEMP RESOURCE ID
  // AND LATER CORRELATE THIS WITH AD GROUP OPERATIONS
  /***************************************
   * 2.1 - BUDGET RESOURCE
   * 2.2 - BUDGET OBJECT
   * 2.3 - 2 CAMPAIGN OBJECT + TEMP RESOURCE + BUDGET RESOURCE
   */

  //create shared budget to manage all campaigns under set amount
  const budgetResource = ResourceNames.campaignBudget(
    customer.credentials.customer_id,
    "-1"
  );

  //set up campaign priorities
  const CAMPAIGN_PRIORITIES = {
    HIGH: 2,
    LOW: 0,
  };

  const priorityOrder = [
    { key: "LOW", value: CAMPAIGN_PRIORITIES.LOW },
    { key: "HIGH", value: CAMPAIGN_PRIORITIES.HIGH },
  ];

  //shared budget to manage all created campaigns/adgroups
  const budget: resources.ICampaignBudget = {
    resource_name: budgetResource,
    name: `${campaign?.vendor} shared budget #` + Date.now(),
    amount_micros: toMicros(campaign?.budget),
    delivery_method: enums.BudgetDeliveryMethod.STANDARD,
    explicitly_shared: true,
  };

  const campaigns = createAlphaBetaCampaignResource(
    customer.credentials.customer_id,
    merchId as number,
    campaign?.vendor,
    campaign?.enabled,
    campaign?.enhancedClick,
    budgetResource as resources.ICampaignBudget
  );

  // *****END OF PHASE 2*******//

  // PHASE 3 - CAMPAIGN CRITERION OPERATION
  //TARGETED & EXCLUDED LOCATIONS, AD SCHEDULE, PRE-SET NEGATIVE KEYWORDS
  /***************************************
   * 3.1 - TARGETED & EXCLUDED LOCATIONS
   * 3.2 - AD SCHEDULE
   * 3.3 - PRE-SET NEGATIVE KEYWORDS
   */

  //targetlocations where we want to serve our shopping ads
  const targetedLocations = geoTargetConstant(
    campaign?.targetedLocations,
    false
  );

  //excluded locations where we don't want to serve our ads
  const excludedLocations = geoTargetConstant(
    campaign?.excludedLocations,
    true
  );

  //ad schedule - exclude all null days
  const adSchedule: ScheduleItem[] = campaign?.adSchedule?.days;
  const adScheduleCriteria = createAdSchedule(adSchedule);

  const productTitles = adjustLongTitle(
    campaign?.productTitle,
    campaign?.vendor,
    campaign?.sku
  );

  //negative keywords for high priority campaign - brand, product titles, skus and any generics keywords
  const highNegativeKeywords = [
    campaign?.vendor,
    ...productTitles,
    ...campaign?.sku,
  ];

  //negative keywords for low priority campaign - any generic keywords
  const lowNegativeKeywords = ["used", "refurbished"];

  const campaignCriteriaFields: MutateOperation<resources.ICampaignCriterion>[] =
    [];

  //add targeted, excluded locations, ad schedule, negative keywords into one mutateOperation.
  priorityOrder.forEach((priority: any, i: number) => {
    if (targetedLocations.length > 0) {
      geoTargetService(
        customer.credentials.customer_id,
        targetedLocations,
        i,
        campaignCriteriaFields
      );
    }

    if (excludedLocations.length > 0) {
      geoTargetService(
        customer.credentials.customer_id,
        excludedLocations,
        i,
        campaignCriteriaFields
      );
    }

    if (adScheduleCriteria) {
      adScheduleService(
        customer.credentials.customer_id,
        adScheduleCriteria,
        i,
        campaignCriteriaFields
      );
    }
    //remember to check how this performs in adding kw to correct campaign
    let negativeKeywords =
      priority.value === 0 ? lowNegativeKeywords : highNegativeKeywords;

    if (negativeKeywords.length > 0) {
      addNegativeKeywordsCriterion(
        customer.credentials.customer_id,
        negativeKeywords,
        i,
        campaignCriteriaFields
      );
    }
  });
  // *****END OF PHASE 3*******//

  //PHASE 4 - CREATE ADS GROUP FOR CAMPAIGN
  //EACH AD GROUP WILL HAVE A UNIQUE TEMP RESOURCE AND PAIRED WITH TEMP CAMPAIGN RESOURCE NAME
  /****************************************/

  //create ad group with temp resource name & set ad group CPC and rotation
  const createAdGroups: MutateOperation<resources.IAdGroup>[] =
    priorityOrder.map((priority, index) => {
      let cpc = Number(campaign?.cpc);
      const cpcBidSeparation = Number(campaign?.bidSeparation);

      if (priority.value === 0 && cpcBidSeparation) {
        cpc += cpc * (1 * cpcBidSeparation);
      }

      let fixedCpC = cpc.toFixed(2);
      //resource for ad group
      const adGroupResource = createAdGroupResource(
        customer.credentials.customer_id,
        index,
        priority.key,
        campaign?.vendor,
        fixedCpC
      );

      return {
        entity: "ad_group",
        operation: "create",
        resource: adGroupResource,
      };
    });
  // *****END OF PHASE 4*******//

  //PHASE 5 - SHOPPING AD GROUP AD OPERATION
  /***************************************
   * 5.1 - REFERENCE AD GROUP THE SHOPPING AD GROUP AD WILL BELONG TO
   */
  let adGroupAdShoppingOperation: MutateOperation<resources.IAdGroupAd>[] = [];

  Array.from({ length: 2 }).forEach((_, index) => {
    const adGroupAdResource = createShoppingAdGroupAdResource(
      customer.credentials.customer_id,
      index
    );
    const adGroupShoppingAd: MutateOperation<resources.IAdGroupAd> = {
      entity: "ad_group_ad",
      operation: "create",
      resource: adGroupAdResource,
    };
    adGroupAdShoppingOperation.push(adGroupShoppingAd);
  });
  // *****END OF PHASE 5*******//

  //PHASE 6 - AD GROUP OPERATION - SUBDIVIDE BY ITEM_ID
  //EACH AD GROUP WILL HAVE A UNIQUE TEMP RESOURCE AND PAIRED WITH TEMP CAMPAIGN RESOURCE NAME
  /****************************************/
  let productCriterionOptions: MutateOperation<resources.IAdGroupCriterion>[] =
    [];

  //Get product ids for brand
  const productIds = await getProductIdsForBrand(
    `${merchId}`,
    campaign?.vendor,
    decryptedAccessToken,
    decryptedRefreshToken
  );

  //temp resource ids for each needed partition node
  let rootTempId = -20;
  let brandTempId = -200;
  let otherBrandTempId = -2000;
  let everythingElseTempId = -3000;
  let productTempId = -20000;

  priorityOrder.forEach((priority, adGroupIndex) => {
    let cpc = Number(campaign?.cpc);
    const cpcBidSeparation = Number(campaign?.bidSeparation);

    if (priority.value === 0 && cpcBidSeparation) {
      cpc += cpc * (1 * cpcBidSeparation);
    }

    //divisible cpc value
    const fixedCpC = cpc.toFixed(2);

    //1. root node - null - Parent
    const rootNode = createRootNode(
      customer.credentials.customer_id,
      adGroupIndex,
      rootTempId
    );
    --rootTempId;

    // create operations objects
    const rootNodeOperation: MutateOperation<resources.IAdGroupCriterion> = {
      entity: "ad_group_criterion",
      operation: "create",
      resource: rootNode,
    };
    productCriterionOptions.push(rootNodeOperation);

    //2. brand node -> connected to root node
    const brandNode = createBrandNode(
      customer.credentials.customer_id,
      adGroupIndex,
      brandTempId,
      rootNode.resource_name as string,
      campaign?.vendor?.toLowerCase()
    );
    --brandTempId;

    const brandNodeOperation: MutateOperation<resources.IAdGroupCriterion> = {
      entity: "ad_group_criterion",
      operation: "create",
      resource: brandNode,
    };
    productCriterionOptions.push(brandNodeOperation);

    //3. everything else in brandNode -> rootNode
    const otherBrandNode = createEverythingElseInBrandNode(
      customer.credentials.customer_id,
      adGroupIndex,
      otherBrandTempId,
      fixedCpC,
      rootNode.resource_name as string // was rootNode.resource_name
    );
    --otherBrandTempId;

    const everythingElseInBrandsOperation: MutateOperation<resources.IAdGroupCriterion> =
      {
        entity: "ad_group_criterion",
        operation: "create",
        resource: otherBrandNode,
      };

    productCriterionOptions.push(everythingElseInBrandsOperation);

    //4. others node - products not in brand or product_item_id
    const othersNode = createEverythingElseNode(
      customer.credentials.customer_id,
      adGroupIndex,
      everythingElseTempId,
      fixedCpC,
      brandNode.resource_name as string // was brandNode.resource_name
    );
    --everythingElseTempId;

    const othersOperation: MutateOperation<resources.IAdGroupCriterion> = {
      entity: "ad_group_criterion",
      operation: "create",
      resource: othersNode,
    };

    productCriterionOptions.push(othersOperation);

    // //5. loop over product Ids
    //product_item_ids --> brandNode --> rootNode
    productIds?.forEach((productId, i) => {
      const productItemNode = createProductItemIdNode(
        customer.credentials.customer_id,
        adGroupIndex,
        productTempId,
        productId as string,
        fixedCpC,
        brandNode.resource_name as string
      );
      --productTempId;

      const productItemNodeOperation: MutateOperation<resources.IAdGroupCriterion> =
        {
          entity: "ad_group_criterion",
          operation: "create",
          resource: productItemNode,
        };

      productCriterionOptions.push(productItemNodeOperation);
    });
  });
  // *****END OF PHASE 6*******//

  //PHASE 7 - PERFORM MUTATION
  /***************************************
   * RUN ATOMIC MUTATE OPERATION ON ALL GOOGLE ADS OBJECTS
   */
  //atomic linking between campaigns and budget.
  const alphaBetaCampaign: MutateOperation<
    | resources.ICampaignBudget
    | resources.ICampaign
    | resources.ICampaignCriterion
    | resources.IAdGroup
    | resources.IAdGroupAd
    | resources.IAdGroupCriterion
  >[] = [
    { entity: "campaign_budget", operation: "create", resource: budget },
    ...campaigns,
    ...campaignCriteriaFields,
    ...createAdGroups,
    ...adGroupAdShoppingOperation,
    ...productCriterionOptions,
  ];

  try {
    await customer.mutateResources(alphaBetaCampaign);
    if (user) {
      user.createdCampaigns = user.createdCampaigns += 1;
      user.totalCreatedCampaigns = user.totalCreatedCampaigns += 1;
      await user.save();
    }
    //console.log("Campaign Created Sucessfully");
    res
      .status(201)
      .json({ message: "Alpha-Beta campaign successfully created.", ok: true });
  } catch (err) {
    //...do something with err
    console.log(
      "I pre-created a set of errors for you to get an idea of what's wrong and where. Goodluck!",
      err
    );
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res
      .status(500)
      .json({ message: "Failed to create Campaign.", ok: false });
  }

  // user.createdCampaigns = user.createdCampaigns += 1;

  // try {
  //   await GoogleAdsAuth.findByIdAndUpdate(id, {
  //     createdCampaigns: user.createdCampaigns,
  //   });
  // } catch (err) {
  //   console.log(err);
  //   return res
  //     .status(500)
  //     .json({ message: "Error updating campaign creation total" });
  // }
}
