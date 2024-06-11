import { Request, Response } from "express";
import { google } from "googleapis";

import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../util/helpers/getMerchantCenterId";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  const googleUser = await findGoogleAuthById(id as string, res);
  const accessToken = decryptData(googleUser.access_token);
  const refreshToken = decryptData(googleUser.refresh_token);
  const googleAccountId = decryptData(googleUser.googleAccountId);

  let merchId;
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
    `${process.env.NEXT_PUBLIC_NGROK_URI}`
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
      maxResults: 100,
      fields: "resources(brand), nextPageToken",
    });

    const brands = data?.resources?.map((product) => product?.brand);
    uniqueBrands = [...new Set(brands)];
    res.status(200).json({ products: data.resources, brands: uniqueBrands });
  } catch (err) {
    console.log("Error retrieving Google Merchant data", err);
  }
}
