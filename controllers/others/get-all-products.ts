import { Request, Response } from "express";
import { google } from "googleapis";

import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../util/helpers/getMerchantCenterId";

export default async function (req: Request, res: Response) {
  const { id, nextPageToken, limit } = req.query;
  const { filter, filterBy } = req.body;
  const limitNum = Number(limit) || 15;

  console.log("next Page Token", nextPageToken);

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

  try {
    const { data } = await content.products.list({
      merchantId: `${merchId}`,
      maxResults: limitNum,
      ...(nextPageToken !== "undefined" && {
        pageToken: nextPageToken as string,
      }),
    });

    // const filterables = ["brand", "productType"];
    // let prods;
    // if(filterables.includes(filterBy)){
    //     //product['brand'] === 'Dimplex'
    //     prods = (data?.resources as any[]).filter((product) => product[filterBy] === filter)?.map((product) => ({
    //         title: product?.title,
    //         id: product?.id,
    //         imageLink: product?.imageLink,
    //         brand: product?.brand,
    //         salePrice: product?.price,
    //         link: product?.link,
    //       }));
    // } else {
    //     prods = data?.resources?.map((product) => ({
    //         title: product?.title,
    //         id: product?.id,
    //         imageLink: product?.imageLink,
    //         brand: product?.brand,
    //         salePrice: product?.price,
    //         link: product?.link,
    //       }));
    // }

    //all products
    const products = data?.resources?.map((product) => ({
      title: product?.title,
      id: product?.id,
      imageLink: product?.imageLink,
      brand: product?.brand,
      salePrice: product?.price,
      link: product?.link,
    }));

    res.status(200).json({
      productCount: products?.length,
      products,
      nextPageToken: data?.nextPageToken,
      ok: true,
    });
  } catch (err) {
    console.log("Error counting products", err);
    res.status(500).json({
      error: "There was an error, please check the console." + err,
      ok: false,
    });
  }
}
