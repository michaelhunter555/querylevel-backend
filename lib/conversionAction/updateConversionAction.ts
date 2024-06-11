import { resources } from "google-ads-api";

import { WebsiteConversion } from "../../types";

export const updateConversionAction = (
  conversionData: WebsiteConversion,
  resourceName: string
) =>
  new resources.ConversionAction({
    resource_name: resourceName,
    name: conversionData?.conversionName,
    value_settings: {
      default_value: conversionData.defaultValue,
      always_use_default_value: conversionData.alwaysUseDefaultValue,
    },
    counting_type: conversionData.countingType,
    attribution_model_settings: {
      attribution_model: conversionData.attributionModel,
    },
    click_through_lookback_window_days:
      conversionData.clickThroughLookbackWindowDays,
    view_through_lookback_window_days:
      conversionData.viewThroughLookbackWindowDays,
    primary_for_goal: conversionData.primaryForGoal,
  });
