import { google } from "googleapis";

export const getProductsForBrand = async (
  merchId: string,
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

  let uniqueBrands: (string | null | undefined)[];
  try {
    const { data } = await content.products.list({
      merchantId: `${merchId}`,
      maxResults: 10,
      fields: "resources(brand), nextPageToken",
    });

    const brands = data?.resources?.map((product) => product?.brand);
    uniqueBrands = [...new Set(brands)];
    return uniqueBrands;
  } catch (err) {
    console.log("Error retrieving Google Merchant data", err);
  }
};
