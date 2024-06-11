import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";
import { adGroupsQuery } from "../../util/queries/queries";

export default async function (req: Request, res: Response) {
  const { id, campaignId, segment, status } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const query = adGroupsQuery(
    campaignId as string,
    customer.credentials.customer_id,
    segment as string,
    status as string
  );

  try {
    const adGroups = await customer.query(query);

    res.status(200).json({ adGroups });
    //console.log("USERADGROUPS.ts RAN");
  } catch (err) {
    console.log("error getting adGroups for campaigns.", err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res
      .status(500)
      .json({ message: "There was an error retrieving adGroup Data." });
  }
}
