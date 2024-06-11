import { google } from "googleapis";

import { getMerchantCenterId } from "./getMerchantCenterId";

export const getActiveShoppingData = async (
  brand: string,
  accessToken: string,
  refreshToken: string,
  googleAccountId: string
) => {
  let merchId: number | string | undefined;
  try {
    merchId = await getMerchantCenterId(
      refreshToken,
      googleAccountId as string
    );
  } catch (err) {
    console.log(err);
  }

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

    const productKeywords = products?.map((product) => ({
      sku: product.mpn,
      brand: product.brand,
      title: product.title,
    }));

    return productKeywords;
  } catch (err) {
    console.log("Error counting products", err);
  }
};
