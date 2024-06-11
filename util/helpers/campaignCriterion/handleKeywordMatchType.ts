import { enums } from "google-ads-api";

export const handleKeywordMatchType = (keyword: string) => {
  const phraseMatch = /["'](.*)["']/; //capture all text between ""
  const exactMatch = /\[(.*)\]/; // capture all text between []

  let matchType: number;
  let extractedKeyword: string;

  const checkPhraseMatch = keyword.match(phraseMatch);
  const checkExactMatch = keyword.match(exactMatch);

  if (checkPhraseMatch) {
    extractedKeyword = checkPhraseMatch[1];
    matchType = enums.KeywordMatchType.PHRASE;
  } else if (checkExactMatch) {
    extractedKeyword = checkExactMatch[1];
    matchType = enums.KeywordMatchType.EXACT;
  } else {
    extractedKeyword = keyword;
    matchType = enums.KeywordMatchType.BROAD;
  }

  return {
    keyword: extractedKeyword,
    matchType,
  };
};
