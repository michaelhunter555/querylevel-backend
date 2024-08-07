import axios from 'axios';
import {
  Request,
  Response,
} from 'express';
import { errors } from 'google-ads-api';

import { getClient } from '../../lib/getClient';
import GoogleAdsAuth from '../../models/GoogleAdsAuth';
import { decryptData } from '../../util/encryption/decryptData';
import { encryptData } from '../../util/encryption/encryptData';
import { findGoogleAuthById } from '../../util/helpers/findGoogleAuthById';
import { googleError } from '../../util/helpers/googleError';
import { refreshAccessToken } from '../../util/helpers/refreshAccessToken';

export default async function (req: Request, res: Response) {
  const { id, keywordLevel, campaignId, pageToken, page, limit } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  if (!user.googleAccountId) {
    return res
      .status(400)
      .json({ message: "Google Id account not found", noAccountId: true });
  }

  const refreshToken = decryptData(user?.refresh_token);
  let accessToken = decryptData(user?.access_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  // Function to check if the access token is valid
  const isTokenValid = async (token: string): Promise<boolean> => {
    try {
      const testUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`;
      await axios.get(testUrl);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Check if the access token is valid
  const tokenValid = await isTokenValid(accessToken);

  // If the token is not valid, refresh it
  if (!tokenValid) {
    try {
      accessToken = await refreshAccessToken(refreshToken);
      // Update the user's access token in the database
      const encryptedAccessToken = encryptData(accessToken);
      await GoogleAdsAuth.findByIdAndUpdate(user._id, {
        access_token: encryptedAccessToken,
      });
    } catch (err: any) {
      return res.status(500).json({
        message: "Failed to refresh access token",
        error: err.message,
      });
    }
  }

  let negativeKeywordQuery: string = "";

  if (keywordLevel === "AD_GROUP") {
    negativeKeywordQuery = `
    SELECT 
    ad_group_criterion.keyword.text, 
    ad_group_criterion.keyword.match_type, 
    ad_group_criterion.criterion_id, 
    ad_group.id, 
    campaign.id, 
    campaign.name, 
    ad_group.name, 
    ad_group_criterion.negative 
  FROM ad_group_criterion 
  WHERE campaign.id = ${campaignId}
 
  `;
  } else if (keywordLevel === "CAMPAIGN") {
    negativeKeywordQuery = `
    SELECT
    campaign_criterion.criterion_id,
    campaign_criterion.keyword.match_type,
    campaign_criterion.keyword.text,
    campaign.id,
    campaign.name,
    campaign_criterion.negative
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}`;
  }

  const queryUrl = `https://googleads.googleapis.com/v16/customers/${accountId}/googleAds:search`;
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;

  const requestBody = {
    query: negativeKeywordQuery,
    page_size: 10,
    ...(pageToken !== "null" ? { page_token: String(pageToken) } : {}),
    returnTotalResultsCount: true,
  };

  console.log("request body", requestBody);

  const response = await axios.post(queryUrl, requestBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "developer-token": developerToken,
    },
  });

  console.log("REST API RESPONSE:", response);

  const responseData = response.data;

  try {
    console.log("current_token", String(pageToken) || "");
    // const response = await customer.query(negativeKeywordQuery, {
    //   ...(pageToken ? { page_token: String(pageToken) } : {}),
    //   page_size: 10,
    // }); //{ page_token: pageToken as string ?? null, page_size: 100 }

    const totalPages = Math.ceil(
      Number(responseData.totalResultsCount) / requestBody.page_size
    );
    if (keywordLevel === "AD_GROUP") {
      res.status(200).json({
        adGroupCriterion: responseData.results,
        nextPageToken: responseData.nextPageToken,
        keywordLevel,
        totalPages,
      });
    } else {
      res
        .status(200)
        .json({ campaignCriterion: responseData.results, keywordLevel });
    }
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: `Error retrieving negative keywords at ${keywordLevel}`,
    });
  }
}
