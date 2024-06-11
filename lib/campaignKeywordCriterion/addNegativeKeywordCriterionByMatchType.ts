import { enums, MutateOperation, resources } from "google-ads-api";

import { handleKeywordMatchType } from "../../util/helpers/campaignCriterion/handleKeywordMatchType";

const negativeKeywordMatchType = (keyword: string) => {
  //check if keyword starts and ends with brackets
  if (/^\[.*\]$/.test(keyword)) {
    return enums.KeywordMatchType.EXACT;
  }
  //check if keyword starts and ends with quotes
  if (/^\".*"$/.test(keyword)) {
    return enums.KeywordMatchType.PHRASE;
  }
  //otherwise broad
  return enums.KeywordMatchType.BROAD;
};

export const addNegativeKeywordsCriterionByMatchType = (
  customer: string,
  negativeKeywords: string[],
  arr: MutateOperation<resources.ICampaignCriterion>[]
) => {
  return negativeKeywords
    ?.filter((k) => k?.length > 0)
    ?.forEach((keyword) => {
      //store the matchtype of keyword
      let keywords = handleKeywordMatchType(keyword.trim());

      arr.push({
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          campaign: `customers/${customer}/campaigns/${-3}`,
          keyword: {
            text: keywords.keyword,
            match_type: keywords.matchType,
          },
          negative: true,
        },
      });
    });
};
