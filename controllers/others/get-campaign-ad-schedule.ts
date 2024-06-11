import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";
import { getCurrentAdSchedule } from "../../util/queries/queries";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const googleAccountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    refresh_token: refreshToken,
    customer_id: googleAccountId,
  });

  const query = getCurrentAdSchedule(campaignId as string);

  try {
    const adScheduleResult = await customer.query(query);
    //console.log(adScheduleResult);
    res.status(200).json({ adScheduleResult });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message:
        "There was an error retrieving ad schedule information for selected campaign",
    });
  }
}
