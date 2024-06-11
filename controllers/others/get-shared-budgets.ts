import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const query = `
    SELECT
    campaign_budget.resource_name,
    campaign_budget.name,
    campaign_budget.reference_count,
    campaign_budget.amount_micros
    FROM campaign_budget
    WHERE campaign_budget.explicitly_shared = TRUE
    `;

  try {
    const result = await customer.query(query);
    res.status(200).json({ sharedBudgets: result });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: "There was a message with the query for shared budgets.",
    });
  }
}
