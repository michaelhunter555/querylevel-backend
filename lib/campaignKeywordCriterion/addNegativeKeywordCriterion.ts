import { enums, MutateOperation, resources } from "google-ads-api";

export const addNegativeKeywordsCriterion = (
  customer: string,
  negativeKeywords: string[],
  index: number,
  arr: MutateOperation<resources.ICampaignCriterion>[],
  matchType?: number
) => {
  return negativeKeywords?.forEach((keyword) =>
    arr.push({
      entity: "campaign_criterion",
      operation: "create",
      resource: {
        campaign: `customers/${customer}/campaigns/${-3 - index}`,
        keyword: {
          text: keyword,
          match_type: matchType ? matchType : enums.KeywordMatchType.PHRASE,
        },
        negative: true,
      },
    })
  );
};
