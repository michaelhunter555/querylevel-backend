import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import GoogleAdsAuth from "../../models/GoogleAdsAuth";
import { decryptData } from "../../util/encryption/decryptData";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, accountId } = req.query;

  let user;

  try {
    user = await GoogleAdsAuth.findById(id);
  } catch (err) {
    console.log("There was an error with the request to find user by id.", err);
    return res.status(500).json({
      message: "There was an error with the request to find user by id.",
    });
  }

  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found during customer metrics operation." });
  }

  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();

  const customer = client.Customer({
    customer_id: `${accountId}`,
    refresh_token: decryptedRefreshToken,
  });

  const customerQuery = `
  SELECT
    metrics.clicks,
    metrics.cost_micros,
    metrics.impressions,
    metrics.conversion_value
  FROM
    customer
  WHERE
    segments.date DURING LAST_30_DAYS
`;
  let result;
  try {
    result = await customer.query(customerQuery);
    res.status(200).json({ customerMetrics: result });
  } catch (err) {
    console.log(err);

    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res.status(500).json({
      message: "There was an error with the query in customer-metrics.",
    });
  }
}
