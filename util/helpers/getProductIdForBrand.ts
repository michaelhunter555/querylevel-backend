import { errors } from "google-ads-api";
import { google } from "googleapis";

import { googleError } from "./googleError";

export const getProductIdsForBrand = async (
  merchId: string,
  brand: string,
  accessToken: string,
  refreshToken: string
) => {
  const oAuth2Client = new google.auth.OAuth2(
    `${process.env.GOOGLE_CLIENT_ID}`,
    `${process.env.GOOGLE_CLIENT_SECRET}`,
    `${process.env.PUBLIC_NGROK_URI}`
  );

  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const content = google.content({ version: "v2.1", auth: oAuth2Client });

  let pageToken;

  try {
    const { data } = await content.products.list({
      merchantId: `${merchId}`,
      maxResults: 250,
      pageToken: pageToken,
    });

    //all products under the queried brand
    const products = data?.resources?.filter(
      (product) => product.brand === brand
    );

    const productId = products?.map((product) => product?.id?.split(":")[3]);

    return productId;
  } catch (err) {
    console.log("Error counting products", err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
  }
};
