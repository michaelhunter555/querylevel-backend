import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { googleError } from "./googleError";

export async function getMerchantCenterId(
  refreshToken: string,
  accountId: string
) {
  const client = getClient();

  const customer = client.Customer({
    customer_id: `${accountId}`,
    refresh_token: refreshToken,
  });

  const query = `
    SELECT campaign.shopping_setting.merchant_id
    FROM campaign
    WHERE campaign.shopping_setting.merchant_id IS NOT NULL
    LIMIT 1
    `;

  let merchant;

  try {
    merchant = await customer.query(query);

    if (merchant && merchant[0].campaign?.shopping_setting?.merchant_id) {
      return merchant[0].campaign.shopping_setting.merchant_id;
    }
  } catch (err) {
    console.log(
      "There was an error during the query for merchant_center id.",
      err
    );

    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
  }
}
