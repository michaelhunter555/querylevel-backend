import FuzzySet from "fuzzyset";
import {
  enums,
  MutateOperation,
  ResourceNames,
  resources,
} from "google-ads-api";

const MATCH_THRESHOLD = 0.8;

let tempResource = -1;

const handleOperationCheck = (
  level: "campaign" | "ad_group",
  customerId: string,
  adGroupId: string | number,
  campaignId: string | number,
  searchTerm: string,
  arr: MutateOperation<
    resources.ICampaignCriterion | resources.IAdGroupCriterion
  >[]
) => {
  const resourceLevel =
    level === "campaign"
      ? ResourceNames.campaign(customerId, campaignId)
      : ResourceNames.adGroup(customerId, adGroupId);
  const tempResourceName =
    level === "campaign"
      ? ResourceNames.campaignCriterion(customerId, campaignId, tempResource)
      : ResourceNames.adGroupCriterion(customerId, adGroupId, -1);

  const newKeyword = new resources.CampaignCriterion({
    resource_name: tempResourceName,
    campaign: resourceLevel, //will only be campaign for now
    keyword: {
      text: searchTerm,
      match_type: enums.KeywordMatchType.PHRASE,
    },
    negative: true,
  });

  const negativeKeywordOperation: MutateOperation<
    resources.ICampaignCriterion | resources.IAdGroupCriterion
  > = {
    entity: level === "campaign" ? "campaign_criterion" : "ad_group_criterion",
    operation: "create",
    resource: newKeyword,
  };

  arr.push(negativeKeywordOperation);
};

function initializeFuzzySets(products: any[]) {
  const productTitleSet = FuzzySet();
  const skuSet = FuzzySet();

  //add produt titles and skus into a set to check
  products.forEach((product) => {
    productTitleSet.add(product.title.toLowerCase());
    skuSet.add(product.sku.toLowerCase());
  });

  return { productTitleSet, skuSet };
}

type ShouldAddNegative = {
  resultsTitle: [number, string][] | null;
  resultsSku: [number, string][] | null;
  resultBrand: [number, string][] | null;
  MATCH_THRESHOLD: number;
};

function shouldAddAsNegative({
  resultsTitle,
  resultsSku,
  resultBrand,
  MATCH_THRESHOLD,
}: ShouldAddNegative) {
  return (
    (resultsTitle && resultsTitle[0][0] > MATCH_THRESHOLD) ||
    (resultsSku && resultsSku[0][0] > MATCH_THRESHOLD) ||
    (resultBrand && resultBrand[0][0] > MATCH_THRESHOLD)
  );
}

type SearchTermQueryResult = {
  adGroupName: string;
  adGroupId: number | string;
  campaignId: number;
  campaignName: string;
  priority: number;
  search_term: string;
};

export const keywordCleanUpCheck = (
  customerId: string,
  brand: string,
  products: any[],
  flatSearchTermData: SearchTermQueryResult[],
  operationLevel: "campaign" | "ad_group",
  newKeywordArr: MutateOperation<
    resources.ICampaignCriterion | resources.IAdGroupCriterion
  >[]
) => {
  //destructure our fuzzy sets
  const { productTitleSet, skuSet } = initializeFuzzySets(products);
  const brandSet = FuzzySet([brand.toLowerCase()]);

  //loop over query result from GAQL
  flatSearchTermData.forEach((searchTerm) => {
    const { campaignId, adGroupId, search_term, priority } = searchTerm;
    const search_term_lower = search_term.toLowerCase();
    const resultsTitle = productTitleSet.get(search_term_lower);
    const resultsSku = skuSet.get(search_term_lower);
    const resultBrand = brandSet.get(search_term_lower);

    //if above the match threshold, should return true
    const shouldAddNegativeKeyword = shouldAddAsNegative({
      resultsTitle,
      resultsSku,
      resultBrand,
      MATCH_THRESHOLD,
    });

    //just because it matches doesn't mean it should be a negative keyword
    //check the prioity and if appropriote add as negative keyword
    const isRelevant = checkRelevanceByPriority(
      priority,
      Boolean(shouldAddNegativeKeyword),
      search_term,
      brand
    );

    //if relevant, meaning we need to remove it
    //run operation to create new negative keyword resource
    if (isRelevant) {
      handleOperationCheck(
        operationLevel,
        customerId,
        adGroupId,
        campaignId,
        search_term,
        newKeywordArr
      );
      //decrement temp resource
      tempResource--;
    }
  });
};

/**
 * @note for priorityLevel- 2 = high, 1 = medium and 0 = low
 * @param priorityLevel
 * @param shouldAddNegativeKeyword
 * @param search_term
 * @param brand
 * @returns  boolean
 */
function checkRelevanceByPriority(
  priorityLevel: number,
  shouldAddNegativeKeyword: boolean,
  search_term: string,
  brand: string
) {
  if (priorityLevel === 2) {
    //this means if we match a brand, sku or product title in a high priority campaign, we should add as negative
    return shouldAddNegativeKeyword;
  } else if (priorityLevel === 1) {
    //if we find a non brand related search terms, we add as negatives
    const brandMatchRegex = new RegExp(brand, "i");
    return shouldAddNegativeKeyword || !search_term.match(brandMatchRegex);
  } else if (priorityLevel === 0) {
    //if brand, sku or product title, we leave it alone
    return !shouldAddNegativeKeyword;
  }
}
