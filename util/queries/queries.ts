export const getAppAnalyticsQuery = (segment: string) => {
  if (segment === "ALL_TIME") {
    return `
    SELECT
    campaign.name,
    campaign.advertising_channel_type,
    campaign.resource_name,
    campaign.status,
    segments.product_title,
    metrics.conversions,
    metrics.conversions_value,
    metrics.clicks,
    metrics.cost_micros,
    metrics.cost_per_conversion,
    metrics.ctr,
    metrics.impressions,
    metrics.average_cpc,
    campaign.id
    FROM shopping_performance_view
    WHERE
    campaign.status = 'ENABLED'
    AND campaign.advertising_channel_type = 'SHOPPING'
      `;
  }
  return `
  SELECT
  campaign.name,
  campaign.advertising_channel_type,
  campaign.resource_name,
  campaign.status,
  segments.product_title,
  metrics.conversions,
  metrics.conversions_value,
  metrics.clicks,
  metrics.cost_micros,
  metrics.cost_per_conversion,
  metrics.ctr,
  metrics.impressions,
  metrics.average_cpc,
  campaign.id,
  segments.date
  FROM shopping_performance_view
  WHERE
  campaign.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SHOPPING'
  AND segments.date DURING ${segment}
  ORDER BY
  segments.date ASC
    `;
};

//For Editing campaigns
export const getEditableCampaignData = (campaignId: string | number) => {
  return `
    SELECT 
  campaign.advertising_channel_sub_type, 
  campaign.advertising_channel_type, 
  campaign.bidding_strategy, 
  campaign.bidding_strategy_type, 
  campaign.campaign_budget, 
  campaign.geo_target_type_setting.negative_geo_target_type, 
  campaign.geo_target_type_setting.positive_geo_target_type, 
  campaign.id, 
  campaign.name,  
  campaign.network_settings.target_google_search,  
  campaign.network_settings.target_search_network, 
  campaign.manual_cpc.enhanced_cpc_enabled, 
  campaign.resource_name, 
  campaign.shopping_setting.campaign_priority, 
  campaign.shopping_setting.enable_local, 
  campaign.shopping_setting.feed_label, 
  campaign.start_date, 
  campaign.status,
  campaign_budget.name, 
  campaign_budget.explicitly_shared, 
  campaign_budget.delivery_method, 
  campaign_budget.amount_micros, 
  campaign_budget.id 
FROM campaign
WHERE campaign.id = ${campaignId}
    `;
};

export const getCampaignQuery = (segment: string, status: string) => {
  if (status === "PAUSED") {
    //console.log("PAUSE SELECTION RAN");
    return `
          SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              metrics.cost_micros,
              metrics.ctr,
              metrics.average_cpc,
              metrics.average_cost,
              metrics.clicks,
              metrics.all_conversions,
              metrics.impressions
          FROM
              campaign
          WHERE
              campaign.status = '${status}'
              AND campaign.advertising_channel_type = 'SHOPPING'
          `;
  }

  if (segment === "ALL_TIME") {
    //console.log("ALL_TIME SELECTION RAN");
    return `
    SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.average_cost,
          metrics.clicks,
          metrics.all_conversions,
          metrics.impressions
      FROM
          campaign
      WHERE
      campaign.status = '${status}'
      AND campaign.advertising_channel_type = 'SHOPPING'
      `;
  }
  //console.log("DEFAULT SELECTION RAN");
  return `
      SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.average_cost,
          metrics.clicks,
          metrics.all_conversions,
          metrics.impressions,
          segments.date
      FROM
          campaign
      WHERE
          campaign.status = '${status}'
          AND campaign.advertising_channel_type = 'SHOPPING'
          AND segments.date DURING ${segment}
      ORDER by
      segments.date ASC
      `;
};

//run these two together in promise.all?
export const adGroupsQuery = (
  campaignId: string,
  customerId: string,
  segment: string,
  status: string
) => {
  if (status === "PAUSED") {
    return `
        SELECT 
  campaign.id, 
  campaign.bidding_strategy_type,
  ad_group.campaign, 
  ad_group.cpc_bid_micros, 
  ad_group.id, 
  ad_group.name, 
  ad_group.resource_name, 
  ad_group.target_roas, 
  ad_group.target_cpa_micros, 
  ad_group.status,
  metrics.average_cpc,
  metrics.clicks,
  metrics.conversions,
  metrics.cost_micros,
  metrics.ctr,
  metrics.impressions
FROM ad_group 
WHERE 
  ad_group.campaign = 'customers/${customerId}/campaigns/${campaignId}'
  AND ad_group.status != 'REMOVED'
  `;
  }

  if (segment === "ALL_TIME") {
    return `
    SELECT 
  campaign.id, 
  campaign.bidding_strategy_type,
  ad_group.campaign, 
  ad_group.cpc_bid_micros, 
  ad_group.id, 
  ad_group.name, 
  ad_group.resource_name, 
  ad_group.target_roas, 
  ad_group.target_cpa_micros, 
  ad_group.status,
  metrics.average_cpc,
  metrics.clicks,
  metrics.conversions,
  metrics.cost_micros,
  metrics.ctr,
  metrics.impressions
FROM ad_group 
WHERE 
  ad_group.campaign = 'customers/${customerId}/campaigns/${campaignId}'
  AND ad_group.status = '${status}'
  AND ad_group.status != 'REMOVED'`;
  }

  return `
    SELECT 
  campaign.id, 
  campaign.bidding_strategy_type,
  ad_group.campaign, 
  ad_group.cpc_bid_micros, 
  ad_group.id, 
  ad_group.name, 
  ad_group.resource_name, 
  ad_group.target_roas, 
  ad_group.target_cpa_micros, 
  ad_group.status,
  metrics.average_cpc,
  metrics.clicks,
  metrics.conversions,
  metrics.cost_micros,
  metrics.ctr,
  metrics.impressions,
  segments.date
FROM ad_group 
WHERE 
  ad_group.campaign = 'customers/${customerId}/campaigns/${campaignId}'
  AND segments.date DURING ${segment}
  AND ad_group.status = '${status}'
  ORDER by
  segments.date ASC `;
};

//
export const adGroupCriterionListingGroupsQeury = (adGroupResource: string) => {
  return `
    SELECT 
  campaign.id, 
  campaign.resource_name, 
  ad_group.id, 
  ad_group.campaign, 
  ad_group_criterion.ad_group, 
  ad_group_criterion.cpc_bid_micros, 
  ad_group_criterion.criterion_id, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.case_value.product_type.level, 
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.parent_ad_group_criterion, 
  ad_group_criterion.listing_group.case_value.product_brand.value, 
  ad_group_criterion.listing_group.case_value.product_category.level, 
  ad_group_criterion.listing_group.case_value.product_channel.channel, 
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.status, 
  ad_group.cpc_bid_micros 
FROM ad_group_criterion 
WHERE 
  ad_group.id = ${adGroupResource} `;
};

export const productPartitionUnitQuery = (
  segment: string,
  status: string,
  adGroupId: number
) => {
  if (status === "PAUSED") {
    return `
    SELECT 
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.listing_group.type,
  ad_group_criterion.status,  
  ad_group_criterion.listing_group.case_value.product_type.level,
  ad_group_criterion.listing_group.case_value.product_brand.value,
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.parent_ad_group_criterion,
  ad_group_criterion.resource_name,
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.listing_group.path, 
  ad_group.id 
FROM ad_group_criterion 
WHERE ad_group.id = ${adGroupId} 
        `;
  }
  return `
  SELECT 
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.listing_group.type,
  ad_group_criterion.status,
  ad_group_criterion.criterion_id,
  ad_group_criterion.listing_group.case_value.product_type.level,
  ad_group_criterion.listing_group.case_value.product_brand.value,
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.parent_ad_group_criterion,
  ad_group_criterion.resource_name,
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.listing_group.path, 
  ad_group.id 
FROM ad_group_criterion 
WHERE ad_group_criterion.listing_group.type = 'UNIT'
AND ad_group.id = ${adGroupId} 
  `;
};

export const productPartitionSubdivisionQuery = (adGroupId: number) => {
  return `
    SELECT
    ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.listing_group.type,
  ad_group_criterion.status,
  ad_group_criterion.criterion_id,
  ad_group_criterion.listing_group.case_value.product_type.level,
  ad_group_criterion.listing_group.case_value.product_brand.value,
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.parent_ad_group_criterion,
  ad_group_criterion.resource_name,
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.listing_group.path, 
  ad_group.id 
FROM ad_group_criterion 
WHERE ad_group_criterion.listing_group.type = 'SUBDIVISION'
AND ad_group.id = ${adGroupId} `;
};

export const productGroupViewQuery = (
  status: string,
  segment: string,
  adGroupId: number
) => {
  if (status === "PAUSED") {
    return `
    SELECT 
  ad_group_criterion.criterion_id,
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.listing_group.parent_ad_group_criterion, 
  ad_group_criterion.listing_group.case_value.product_brand.value, 
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.path, 
  ad_group_criterion.listing_group.type, 
  ad_group_criterion.negative, 
  ad_group_criterion.type, 
  ad_group_criterion.status,
  metrics.clicks, 
  metrics.conversions, 
  metrics.cost_micros, 
  metrics.ctr, 
  metrics.conversions_value, 
  metrics.impressions, 
  metrics.average_cpc,
  ad_group.id
FROM product_group_view 
WHERE
  ad_group_criterion.type = 'LISTING_GROUP' 
  AND ad_group.id = ${adGroupId}`;
  }

  if (segment === "ALL_TIME") {
    return `
  SELECT 
  ad_group_criterion.criterion_id,
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.listing_group.parent_ad_group_criterion, 
  ad_group_criterion.listing_group.case_value.product_brand.value, 
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.path, 
  ad_group_criterion.listing_group.type, 
  ad_group_criterion.negative, 
  ad_group_criterion.type, 
  ad_group_criterion.status,
  metrics.clicks, 
  metrics.conversions, 
  metrics.cost_micros, 
  metrics.ctr, 
  metrics.conversions_value, 
  metrics.impressions, 
  metrics.average_cpc,
  ad_group.id
FROM product_group_view 
WHERE
  ad_group_criterion.type = 'LISTING_GROUP' 
  AND ad_group.id = ${adGroupId}`;
  }

  return `
  SELECT 
  ad_group_criterion.criterion_id,
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.listing_group.parent_ad_group_criterion, 
  ad_group_criterion.listing_group.case_value.product_brand.value, 
  ad_group_criterion.listing_group.case_value.product_condition.condition, 
  ad_group_criterion.listing_group.case_value.product_type.value, 
  ad_group_criterion.listing_group.case_value.product_item_id.value, 
  ad_group_criterion.listing_group.path, 
  ad_group_criterion.listing_group.type, 
  ad_group_criterion.negative, 
  ad_group_criterion.type, 
  ad_group_criterion.status,
  metrics.clicks, 
  metrics.conversions, 
  metrics.cost_micros, 
  metrics.ctr, 
  metrics.conversions_value, 
  metrics.impressions, 
  metrics.average_cpc,
  segments.date,
  ad_group.id
FROM product_group_view 
WHERE
  ad_group_criterion.type = 'LISTING_GROUP' 
  AND ad_group.id = ${adGroupId}
  AND segments.date DURING ${segment}`;
};

//product tree to compare against criterion operations
export const getProductTreeQuery = (adGroupId: number | string) => {
  return `
  SELECT
  ad_group_criterion.criterion_id,
  ad_group_criterion.listing_group.type,
  ad_group_criterion.listing_group.case_value.product_brand.value,
  ad_group_criterion.listing_group.case_value.product_type.value,
  ad_group_criterion.listing_group.case_value.product_item_id.value,
  ad_group_criterion.listing_group.parent_ad_group_criterion
  FROM product_group_view
  WHERE ad_group.id = ${adGroupId}
  AND ad_group_criterion.type = 'LISTING_GROUP'
  `;
};

//gets all children of the selected node (if any)
//expects parent_ad_group_criterion resource customers/{customerId}/adGroupCriteria/{adGroupId}~{adGroupCriterionId}
export const getParentNodeChildren = (parentNodeResource: string) => {
  return `
  SELECT ad_group_criterion.criterion_id
  FROM product_group_view
  WHERE ad_group_criterion.listing_group.parent_ad_group_criterion = '${parentNodeResource}'`;
};

//get current ad schedule for campaign
export const getCurrentAdSchedule = (campaignId: string) => {
  return `
  SELECT
  campaign_criterion.ad_schedule.day_of_week,
  campaign_criterion.ad_schedule.start_hour,
  campaign_criterion.ad_schedule.end_hour,
  campaign_criterion.ad_schedule.start_minute,
  campaign_criterion.ad_schedule.end_minute,
  campaign.id
  FROM campaign_criterion
  WHERE campaign.id = ${campaignId}
  `;
};
