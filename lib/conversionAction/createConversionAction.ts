import { enums, resources } from "google-ads-api";

import { WebsiteConversion } from "../../types";

export const createConversionAction = (
  conversionData: WebsiteConversion
): resources.IConversionAction => ({
  name: conversionData?.conversionName,
  type: enums.ConversionActionType.WEBPAGE, // enums.ConversionActionType.GOOGLE_ANALYTICS_4_PURCHASE
  category: enums.ConversionActionCategory.PURCHASE,
  value_settings: {
    default_value: conversionData.defaultValue,
    default_currency_code: "USD",
    always_use_default_value: conversionData.alwaysUseDefaultValue,
  },
  counting_type: conversionData.countingType,
  attribution_model_settings: {
    attribution_model: conversionData.attributionModel,
  },
  tag_snippets: [
    {
      type: enums.TrackingCodeType.WEBPAGE,
      page_format: enums.TrackingCodePageFormat.HTML,
      // global_site_tag: "global_site_tag",
      // event_snippet: "event_snippet",
    },
  ],
  click_through_lookback_window_days:
    conversionData.clickThroughLookbackWindowDays,
  view_through_lookback_window_days:
    conversionData.viewThroughLookbackWindowDays,
  primary_for_goal: conversionData.primaryForGoal,
});
