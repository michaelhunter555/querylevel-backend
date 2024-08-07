import FuzzySet from 'fuzzyset';
import {
  enums,
  MutateOperation,
  ResourceNames,
  resources,
} from 'google-ads-api';

const MATCH_THRESHOLD = 0.8;

const createTempResourceId = (num: number = -1) => {
  return () => (num -= 1);
};

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
      ? ResourceNames.campaignCriterion(customerId, campaignId, -1) //*possible issue
      : ResourceNames.adGroupCriterion(customerId, adGroupId, -1);

  const newKeyword = new resources.CampaignCriterion({
    resource_name: tempResourceName,
    campaign: resourceLevel,
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

export const keywordCleanUpCheck = (
  customerId: string,
  brand: string,
  products: any[],
  flatSearchTermData: any[],
  operationLevel: "campaign" | "ad_group",
  newKeywordArr: MutateOperation<
    resources.ICampaignCriterion | resources.IAdGroupCriterion
  >[]
) => {
  const { productTitleSet, skuSet } = initializeFuzzySets(products);
  const brandSet = FuzzySet([brand.toLowerCase()]);

  flatSearchTermData.forEach((searchTerm) => {
    const { campaignId, adGroupId, search_term, priority } = searchTerm;
    const search_term_lower = search_term.toLowerCase();
    const resultsTitle = productTitleSet.get(search_term_lower);
    const resultsSku = skuSet.get(search_term_lower);
    const resultBrand = brandSet.get(search_term_lower);

    const shouldAddNegativeKeyword = shouldAddAsNegative({
      resultsTitle,
      resultsSku,
      resultBrand,
      MATCH_THRESHOLD,
    });

    const isRelevant = checkRelevanceByPriority(
      priority,
      Boolean(shouldAddNegativeKeyword),
      search_term,
      brand
    );

    if (isRelevant) {
      handleOperationCheck(
        operationLevel,
        customerId,
        adGroupId,
        campaignId,
        search_term,
        newKeywordArr
      );
    }
  });
};

function checkRelevanceByPriority(
  priorityLevel: number,
  shouldAddNegativeKeyword: boolean,
  search_term: string,
  brand: string
) {
  if (priorityLevel === 2) {
    return shouldAddNegativeKeyword;
  } else if (priorityLevel === 1) {
    const brandMatchRegex = new RegExp(brand, "i");
    return shouldAddNegativeKeyword || !search_term.match(brandMatchRegex);
  } else if (priorityLevel === 0) {
    return !shouldAddNegativeKeyword;
  }
}
