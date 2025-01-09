import { Request, Response } from "express";
import { google } from "googleapis";

import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../util/helpers/getMerchantCenterId";

export default async function (req: Request, res: Response) {
  //shoppingPromotion created & database Id for user
  const { id } = req.query;

  //connect to database to retrieve our credentials
  const googleUser = await findGoogleAuthById(id as string, res);

  //google credentials decrypted
  const accessToken = decryptData(googleUser.access_token);
  const refreshToken = decryptData(googleUser.refresh_token);
  const googleAccountId = decryptData(googleUser.googleAccountId);

  //get merchantCenterId
  let merchId;

  try {
    //find merchantCenterId
    merchId = await getMerchantCenterId(refreshToken, googleAccountId);

    //create oAuth2 client instance
    const oAuth2Client = new google.auth.OAuth2(
      `${process.env.GOOGLE_CLIENT_ID}`,
      `${process.env.GOOGLE_CLIENT_SECRET}`,
      `${process.env.NEXT_PUBLIC_NGROK_URI}`
    );

    //set credentials
    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    //set version and client
    const content = google.content({ version: "v2.1", auth: oAuth2Client });

    //create promotion details
    const { data } = await content.promotions.list({
      merchantId: `${merchId}`,
      pageSize: 50,
    });
    //successful response to request
    //console.log("Promotions", data?.promotions);
    res.status(201).json({ promotions: data?.promotions, ok: true });
  } catch (err) {
    console.log(
      "There was an error attempting to create a new merchant center promotion: " +
        err
    );
    res.status(500).json({
      error: "Error creating merchant center promotion: " + err,
      ok: false,
    });
  }
}
