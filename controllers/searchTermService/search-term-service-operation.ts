import {
  Request,
  Response,
} from 'express';
import {
  errors,
  MutateOperation,
  resources,
} from 'google-ads-api';

import { getClient } from '../../lib/getClient';
import { decryptData } from '../../util/encryption/decryptData';
import { findGoogleAuthById } from '../../util/helpers/findGoogleAuthById';
import {
  getActiveShoppingData,
} from '../../util/helpers/getMerchantCenterProductData';
import { googleError } from '../../util/helpers/googleError';
import {
  keywordCleanUpCheck,
} from '../../util/helpers/searchTermService/keywordCleanUpCheck';

type ShoppingData = {
  sku: string | null | undefined;
  brand: string | null | undefined;
  title: string | null | undefined;
};

export default async function (req: Request, res: Response) {
  const { id, segment } = req.query;
  const { campaignId, brand, operationLevel } = req.body;

  //get user information
  const user = await findGoogleAuthById(id as string, res);

  if (!user.cleanUpService) {
    res.status(404).json({
      message:
        "You do not have access to this feature. Please upgrade to use this service.",
    });
  }

  //if user has cleanup privelages - lets get started and decrypt data;
  const refreshToken = decryptData(user.refresh_token);
  const googleAccountId = decryptData(user.googleAccountId);
  const accessToken = decryptData(user.access_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: googleAccountId,
    refresh_token: refreshToken,
  });
  const customerId = customer.credentials.customer_id;

  const queryData = `
    SELECT
    campaign.id,
    campaign.name,
    campaign.shopping_setting.campaign_priority,
    ad_group.name,
    ad_group.id,
    search_term_view.search_term,
    search_term_view.status,
    search_term_view.ad_group
    FROM
    search_term_view
    WHERE
    campaign.status = 'ENABLED'
    AND campaign.advertising_channel_type = 'SHOPPING'
        AND segments.date DURING ${segment}
        AND campaign.id = ${campaignId}
        `;

  let searchTerms: any[] = [];
  try {
    searchTerms = await customer.query(queryData);
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ message: err });
  }
  const negativeKeywordOperation: MutateOperation<
    resources.ICampaignCriterion | resources.IAdGroupCriterion
  >[] = [];

  //user inputs brand

  const products = await getActiveShoppingData(
    brand,
    accessToken,
    refreshToken,
    googleAccountId
  );

  if (searchTerms && searchTerms.length > 0) {
    const flattenData = searchTerms.map((searchData) => {
      return {
        adGroupName: searchData.ad_group.name,
        adGroupId: searchData.ad_group.id,
        campaignId: searchData.campaign.id,
        campaignName: searchData.campaign.name,
        priority: searchData.campaign.shopping_setting.campaign_priority,
        ...searchData.search_term_view,
      };
    });

    keywordCleanUpCheck(
      customerId,
      brand,
      products as ShoppingData[],
      flattenData,
      operationLevel,
      negativeKeywordOperation
    );
  }

  try {
    if (negativeKeywordOperation.length > 0) {
      await customer.mutateResources(negativeKeywordOperation);
    }
    res.status(201).json({
      message: "Service Complete.",
      ok: true,
      count: negativeKeywordOperation.length,
    });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ message: "Service Failure", ok: false });
  }
}
