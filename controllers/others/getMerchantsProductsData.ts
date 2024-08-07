import { Request, Response } from "express";
import { google } from "googleapis";

import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../util/helpers/getMerchantCenterId";

export { content_v2_1 } from "googleapis/build/src/apis/content/v2.1";

export default async function (req: Request, res: Response) {
  const { brand, id } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  if (!user.googleAccountId) {
    return res
      .status(400)
      .json({ message: "Google Id account not found", noAccountId: true });
  }

  const accessToken = decryptData(user.access_token);
  const refreshToken = decryptData(user.refresh_token);
  const googleAccountId = decryptData(user.googleAccountId);

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

    //For product preview
    const findFirstProduct = data?.resources?.find(
      (product) => product.brand === brand
    );

    const basicProductPreview = {
      title: findFirstProduct?.title,
      condition: findFirstProduct?.condition,
      imageLink: findFirstProduct?.imageLink,
      brand: findFirstProduct?.brand,
      salePrice: findFirstProduct?.price,
      link: findFirstProduct?.link,
    };

    const productKeywords = products?.map((product) => ({
      id: product.id,
      sku: product.mpn,
      brand: product.brand,
      title: product.title,
      language: product.contentLanguage,
      targetCountry: product.targetCountry,
    }));

    res.status(200).json({
      productCount: products?.length,
      preview: basicProductPreview,
      keywords: productKeywords,
    });
  } catch (err) {
    console.log("Error counting products", err);
    res
      .status(500)
      .json({ error: "There was an error, please check the console." });
  }
}
