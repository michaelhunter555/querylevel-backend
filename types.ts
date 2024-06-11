//types for pages
import { enums } from "google-ads-api";

//pages/user-dashboard.tsx

/**
 * @name: NestedProps
 * @description - Combine metrics and campaing data to combine together under the user's ad account.
 */
export type NestedProps = {
  campaign: Campaign;
  metrics: Metrics;
  segments: Segments;
  id: string;
  name: string;
  status: string;
  cost_micros: number;
  ctr: number;
  average_cpc: number;
  averate_cost: number;
  clicks: number;
  all_conversions: number;
  impressions: number;
  date: Date;
};

/**
 * @name: Segments
 * @description - data by date
 */
type Segments = {
  date: Date;
};

/**
 * @name: UserCampaign
 * @description - Data per campaign for user account
 */
export type UserCampaign = {
  id: string;
  name: string;
  status: string | number;
  cost_micros: number;
  ctr: number;
  average_cpc: number;
  clicks: number;
  all_conversions: number;
  impressions: number;
  date: any;
};

/**
 * @name: Metrics
 * @description - Fields we retreive from GAQL as apart of NestedProps
 */
export type Metrics = {
  cost_micros: number;
  ctr: number;
  average_cpc: number;
  averate_cost: number;
  clicks: number;
  impressions: number;
};
//userData.tsx end

//useShoppingCampaign.tsx

/**
 * @name: Keywords
 * @description - Keywords that will be used in campaigns. Particularly, sku, title & brand
 */
export type Keywords = {
  sku: string[];
  title: string[];
  brand: string;
  targetCountry: string;
  contentLanguage: string;
};

/**
 * @name: SalePrice
 * @description - Sale price - used for Demo product preview
 */
export type SalePrice = {
  value: string;
  current: string;
};

/**
 * @name: InputeValueType
 * @description - Value types for input fields when creating ads - i.e. name: string, cpc: number, targetedLocations: string[], enabled: boolean.
 */
export type InputValueType = string | number | boolean | string[];

/**
 * @name: InputField
 * @description - Value represents the value entered and isValid is a boolean to determine if the input is valid.
 */
export type InputField = {
  value: InputValueType;
  isValid: boolean;
};

/**
 * @name: CampaignData
 * @description - Campaign Data fields - Note* AdSchedule is a separate hook.
 */
export type CampaignData = {
  vendor: InputField;
  campaignType: InputField;
  budget: InputField;
  bidSeparation: InputField;
  cpc: InputField;
  enabled: InputField;
  productTitle: string[];
  sku: string[];
};

/**
 * @name: Budget
 * @description - Ad Campaign settings for the shared budget.
 */
export type Budget = {
  name: string;
  amount_micros: number;
  delivery_method: number;
  explicitly_shared: boolean;
};

/**
 * @name: Campaign
 * @description - Campaign settings for shared budget.
 */
export type Campaign = {
  name: string;
  advertising_channel_type: number;
  advertising_channel_sub_type: number;
  status: number;
  budget?: number;
  campaign_priority?: number;
  enabled?: boolean;
};

/**
 * @name: LocationSettings
 * @description - The selected & excluded locations when creating an ad.
 */
export type LocationSettings = {
  campaign: string;
  locationResourceName: string;
  isNegative?: boolean;
};

/**
 * @name: NonNullScheduleItem
 * @description - Used in ad campaign creation to check if any fields are null when creating AdSchedule
 */
export type NonNullScheduleItem = {
  start_hour: number;
  start_minute: "ZERO" | "FIFTEEN" | "THIRTY" | "FORTY_FIVE";
  end_hour: number;
  end_minute: "ZERO" | "FIFTEEN" | "THIRTY" | "FORTY_FIVE";
  isValid?: boolean;
};

/**
 * @name: CampaignRequestBody
 * @description - Campaign request body expected in POST request when creating campaign
 */
export type CampaignRequestBody = {
  campaign: {
    name: string;
    budget: number;
    cpc: number;
    enabled: boolean;
    vendor: string;
    bidSeparation: number;
    productTitle: string[];
    genericKeywords: string[];
    sku: string[];
    adGroupName?: string;
    targetLocations: string[];
    excludedLocations: string[];
    adSchedule: ScheduleItem[];
  };
};

//endof shopping campaign

//form hook
/**
 * @name: Inputs
 * @description - Form Inputs for useForm() hook.
 */
export type Inputs = {
  value:
    | string
    | number
    | boolean
    | string[]
    | Record<string, any>[]
    | undefined;
  isValid: boolean;
};

/**
 * @name: State
 * @description - State of form hook.
 */
export type State = {
  inputs: Record<string, Inputs>;
  isValid: boolean;
};

/**
 * @name: InputChangeAction
 * @description - input changes in useForm hook.
 */
export type InputChangeAction = {
  type: "INPUT_CHANGE";
  value: string | number | boolean | string[];
  isValid: boolean;
  inputId: string;
};

/**
 * @name: SetFormAction
 * @description - set form to confirm if all fields ar evalid
 */
export type SetFormAction = {
  type: "SET_DATA";
  inputs: Record<string, Inputs>;
  formIsValid: boolean;
};

/**
 * @name: Action
 * @description - Action types for useForm hook
 */
export type Action = InputChangeAction | SetFormAction;
//endof formhook types

//useAdSchedule hook
/**
 * @name: ScheduleState
 * @description - holds day and times start hour, start minute, end hour, end minute.
 */
export type ScheduleState = {
  days: Record<string, ScheduleItem>;
  isValid?: boolean;
};

/**
 * @name: ScheduleItem
 * @description - expected fields for creating google ads  ad schedule.
 */
export type ScheduleItem = {
  day_of_week: number;
  start_hour: number;
  start_minute: MinuteShortHands | number;
  end_hour: number;
  end_minute: MinuteShortHands | number;
  isValid?: boolean;
} | null;

export type MinuteShortHands = "ZERO" | "FIFTEEN" | "THIRTY" | "FORTY_FIVE";

/**
 * @name: ScheduleAction
 * @description - Schedule action types
 */
export type ScheduleAction = {
  type: "SET_DAY_SCHEDULE" | "RESET_SCHEDULE";
  day?: string;
  schedule?: ScheduleItem;
};
//end of useAdSchedule hook

//Home Dash App Analytics

/**
 * @name: AppAnalytics
 * @description - Ad Account data for Auth/Home
 */
export type AppAnalytics = {
  metrics: AppMetrics;
};

/**
 * @name: AppMetrics
 * @description - App metrics for google ads
 */
export type AppMetrics = {
  clicks?: number;
  cost_micros?: number;
  ctr?: number;
  average_cpc?: number;
  average_cost?: number;
  conversions?: number;
};

/**
 * @name: ApiResponse
 * @description - Api Response for Auth/Home
 */
export type ApiResponse = {
  analytics: AppAnalytics[];
  createdCampaigns?: number;
};

/**
 * @name: Loading
 * @description - loading state for Api requests
 */
export type Loading = {
  isLoading: boolean;
};

//Product Performance
/**
 * @name: ProductPerformanceData
 * @description - interface for productPerformanceData Home Dash
 */
export interface ProductPerformanceData {
  segments: TProductPerformanceSegments;
  metrics: TProductPerformanceMetrics;
  campaign: TProductPerformanceCampaign;
  clicks: number;
  average_cpc: number;
  impressions: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
  product_item_id: string;
  product_brand: string;
  product_title: string;
  date: string;
  device: number;
}

/**
 * @name: TProductPerformanceSegments
 * @description - segments of productPerformance Data
 */
export type TProductPerformanceSegments = {
  product_item_id: string;
  product_brand: string;
  product_title: string;
  device: number;
  date: Date;
};

/**
 * @name: TProductPerformanceMetrics
 * @description - Metrics of productPerformane Data
 */
export type TProductPerformanceMetrics = {
  clicks: number;
  impressions: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
  average_cpc: number;
};
/**
 * @name: TProductPerformanceCampaign
 * @description - Campaign related data of productPerformane Data
 */
type TProductPerformanceCampaign = {
  name: string;
  optimization_score: number;
  resource_name?: string;
  id: number;
};

//end of product Performance

//SearchTermView
/**
 * @name: TSearchTerms
 * @description - Search_term_view data
 */
export type TSearchTerms = {
  segments: TSearchTermSegments;
  metrics: TSearchTermMetrics;
  campaign: TCampaignInfo;
  ad_group: TAdGroupInfo;
  search_term_view: TSearchTermsView;
  id: string;
  name: string;
  adGroupName: string;
  adGroupId: number;
  status: string | number;
  cost_micros: number;
  clicks: number;
  impressions: number;
  all_conversions: number;
  search_term_match_type: number;
  search_term: string;
  resource_name: string;
  campaignId: number;
};

/**
 * @name: TCampaignInfo
 * @description - campaign info of search_term_view
 */
type TCampaignInfo = {
  id: number;
  name: string;
  resource_name?: string;
};

type TAdGroupInfo = {
  id: number;
  name: string;
};

/**
 * @name: TSearchTermsMetrics
 * @description - metrics data related Search_term_view
 */
type TSearchTermMetrics = {
  cost_micros: number;
  impressions: number;
  clicks: number;
  all_conversions: number;
};

/**
 * @name: TSearchTermSegments
 * @description - segments related to Search_term_view data
 */
type TSearchTermSegments = {
  search_term_match_type: number;
};

type TSearchTermsView = {
  search_term: string;
  ad_group: string;
  resource_name: string;
};

//end of search_term_view

//website conversion creation
export type WebsiteConversion = {
  conversionName: string;
  defaultValue: number;
  alwaysUseDefaultValue: boolean;
  countingType: number;
  attributionModel: number;
  primaryForGoal: boolean;
  clickThroughLookbackWindowDays: number;
  viewThroughLookbackWindowDays: number;
};

//ConverstionData

export type GetConversionDataResponse = {
  conversion_action: {
    attribution_model_settings: {
      attribution_model: number;
      data_drive_model_status: number;
    };
    value_settings: {
      always_use_default_value: boolean;
      default_value: number;
    };

    phone_call_duration_seconds: number;
    primary_for_goal: boolean;
    id: number;
    category: number;
    name: string;
    counting_type: number;
    click_through_lookback_window_days: number;
    origin: number;
    resource_name: string;
    status: number;
    tag_snippets: [
      {
        event_snippet: string;
        global_site_tag: string;
        page_format: string;
        type: string;
      }
    ];
    type: number;
    view_through_lookback_window_days: number;
  };
  metrics: { all_conversions: number };
};

export type TConversionTable = {
  attribution_model_settings: {
    attribution_model: number;
    data_drive_model_status: number;
  };
  primary_for_goal: boolean;
  category: number;
  name: string;
  id: number;
  counting_type: number;
  click_through_lookback_window_days: number;
  origin: number;
  resource_name: string;
  status: number;
  tag_snippets: [
    {
      event_snippet: string;
      global_site_tag: string;
      page_format: string;
      type: string;
    }
  ];
  type: number;
  phone_call_duration_seconds: number;
  view_through_lookback_window_days: number;
  all_conversions: number;
  allConversions: number;
  value_settings: { always_use_default_value: boolean; default_value: number };
};

//list of available products
export type AvailableProducts = {
  category: string;
  count?: number;
  formState: State;
};

//editable campaign
export type EditableCampaign = {
  advertising_channel_sub_type?: string;
  advertising_channel_type?: string;
  bidding_strategy?: string;
  bidding_strategy_type?: string;
  campaign_budget?: string;
  geo_target_type_setting?: {
    negative_geo_target_type?: string;
    positive_geo_target_type?: string;
  };
  id?: string;
  name?: string;
  network_settings?: {
    target_content_network?: boolean;
    target_google_search?: boolean;
    target_partner_search_network?: boolean;
    target_search_network?: boolean;
  };
  manual_cpc?: {
    enhanced_cpc_enabled?: boolean;
  };
  resource_name?: string;
  shopping_setting?: {
    campaign_priority?: number;
    enable_local?: boolean;
    feed_label?: string;
    sales_country?: string;
  };
  start_date?: string;
  status?: string;
  explicitly_shared?: boolean;
  delivery_method?: string;
  amount_micros?: number;
  budget_name: string;
  budget_id: string | number;
  campaign_name: string;
};

//properties
export type CampaignProperties = {
  campaign: EditableCampaign;
  campaign_budget: EditableCampaignBudget;
};
//budget
export type EditableCampaignBudget = {
  name: string;
  id: string;
  explicitly_shared: boolean;
  delivery_method: string;
  amount_micros: number;
};

//createUpdateCampaignSettings
export type UpdateCampaignSettings = {
  name?: string;
  advertising_channel_type?: enums.AdvertisingChannelType.SHOPPING;
  advertising_channel_sub_type?: enums.AdvertisingChannelSubType.SHOPPING_COMPARISON_LISTING_ADS;
  bidding_strategy?: string;
  bidding_strategy_type?: enums.BiddingStrategyType;
};

//createUpdateNetworkSettings
export type UpdateCampainNetworkSettings = {
  target_content_network?: boolean;
  target_google_search?: boolean;
  target_partner_search_network?: boolean;
  target_search_network?: boolean;
};

//update campaign budget
export type UpdateCampaignBudget = {
  resource_name?: string;
  explicitly_shared?: boolean;
  amount_micros?: number | string;
  delivery_method?: enums.BudgetDeliveryMethod;
};

//update campaign geo targeting
export type UpdateGeoTargetType = {
  negative_geo_target_type?: enums.NegativeGeoTargetType;
  positive_geo_target_type?: enums.PositiveGeoTargetType;
};

//update shopping settings
export type UpdateShoppingSettings = {
  campaign_priority?: number;
  enable_local?: boolean;
  feed_label?: string;
  sales_country?: string;
};

//update bidding strategy
export type UpdateBiddingStrategy = {
  bidding_strategy_type: number;
  bidding_strategy: string;
};

//accordion states for updating campaign
export type AccordionStates = {
  campaignName: boolean;
  budget: boolean;
  enhancedCpc: boolean;
  biddingStrategyType: boolean;
  geoTargetType: boolean;
  networkSettings: boolean;
  enableLocal: boolean;
  adSchedule: boolean;
  campaignPriority: boolean;
  inventoryFilter: boolean;
  // add other accordions as needed
};

export type AdGroupCriterion = {
  ad_group_criterion: {
    status: number;
    criterion_id: string;
    cpc_bid_micros: number;
    resource_name: string;
    product_partition: {
      type: string;
    };
    listing_group: {
      type: number;
      parent_ad_group_criterion: string;
      case_value: {
        product_brand: {
          value: string;
        };

        product_item_id: {
          value: string;
        };

        product_channel: {
          channel: enums.ProductChannel;
        };

        product_condition: {
          condition: enums.ProductCondition;
        };

        product_type: {
          level: enums.ProductTypeLevel;
          value: string;
        };
      };
      path: {
        dimensions: [];
      };
    };
  };
};

export type AdGroupCriterionQuery = {
  partitionUnits: AdGroupCriterion;
  partitionSubdivisions: AdGroupCriterion;
  ad_group_criterion: AdGroupCriterion;
};

export type ProductGroupViewData = {
  criterion_id: number;
  cpc_bid_micros: number;
  listing_group: {
    type: number;
    parent_ad_group_criterion: string;
    case_value: {
      product_brand: {
        value: string;
      };

      product_item_id: {
        value: string;
      };

      // product_channel: {
      //   channel: enums.ProductChannel;
      // };

      // product_condition: {
      //   condition: enums.ProductCondition;
      // };

      product_type: {
        level: enums.ProductTypeLevel;
        value: string;
      };
    };
    path: {
      dimensions: [];
    };
  };
  negative: boolean;
  adGroupResource: string;
  adGroupCriterionResource: string;
  clicks: number;
  conversions: number;
  cost_micros: number;
  ctr: number;
  conversions_value: number;
  impressions: number;
  average_cpc: number;
  date: Date;
};

//ParentChild AdGroup Criterion
export type AdGroupCriterionResource = {
  adGroupResource: string;
  AdGroupCriterionResource: string;
  criterion_id: number;
  listing_group: {
    parent_ad_group_criterion: string | null;
    case_value: {
      product_brand?: { value: string | null };
      //product_condition?: { value: string | null };
      product_type?: { value: string | null };
      product_item_id?: { value: string | null };
    } | null;
    path: {
      dimensions: Array<{
        product_brand?: { value: string };
        product_type?: { level: string; value: string };
        product_item_id?: { value: string };
      }>;
    };
    type: number;
  };
  negative: boolean;
  type: number;
  status: number;
  resource_name: string;
  clicks: number;
  conversions: number;
  cost_micros: number;
  ctr: number | null;
  conversions_value: number;
  impressions: number;
  cpc_bid_micros: number;
  average_cpc: number | null;
  idfromproduct_group_viewwheread_group_criterion: string | null;
  children: AdGroupCriterionResource[];
  level: number;
};

type ProductGroup = AdGroupCriterionResource[];

//productPartition types
export type CriterionData = {
  listingGroupType: number;
  parentId: string; // id extracted on server-side
  status: number;
  negative: boolean;
  brand: string[];
  productType: string[];
  productId: string[];
  partitionId: number;
  adGroupId: string;
};

export type ProductGroupViewResponse = {
  ad_group_criterion: {
    criterion_id: number;
    listing_group: {
      type: number;
      case_value: {
        product_brand: { value: string | null };
        product_type: { value: string | null };
        product_item_id: { value: string | null };
      };
      parent_ad_group_criterion: string | null;
    };
  };
}[];

//path dimensions object
export type DimensionsObject = {
  [key: string]: { [key: string]: string | null | undefined };
};

//case value
export type CaseValue = {
  [key: string]: { [key: string]: string | null | undefined } | undefined;
};

//popper placements
export type PopperPlacement =
  | "auto-start"
  | "auto"
  | "bottom-end"
  | "bottom-start"
  | "bottom"
  | "left-end"
  | "left-start"
  | "left"
  | "right-end"
  | "right-start"
  | "right"
  | "top-end"
  | "top-start"
  | "top";

export type NegativeKeywordView = {
  ad_group_criterion: {
    keyword: { text: string; match_type: number };
    negative: boolean;
    criterion_id: number;
  };
  ad_group: { id: number; name: string; campaign: string };
  campaign: { id: number; name: string };
  keyword: { text: string; match_type: number };
  negative: boolean;
  criterion_id: number;
};

export type NegativeCampaignCriterionKeywordView = {
  campaign_criterion: {
    keyword: { text: string; match_type: number };
    negative: boolean;
    criterion_id: number;
  };
  campaign: { id: number; name: string };
  keyword: { text: string; match_type: number };
  negative: boolean;
  criterion_id: number;
};
