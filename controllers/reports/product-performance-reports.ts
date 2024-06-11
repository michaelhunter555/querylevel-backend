import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import GoogleAdsAuth from "../../models/GoogleAdsAuth";
import { decryptData } from "../../util/encryption/decryptData";
import { getMerchantCenterId } from "../../util/helpers/getMerchantCenterId";
import { getProductIdsForBrand } from "../../util/helpers/getProductIdForBrand";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, accountId, brand } = req.query;

  let user;

  try {
    user = await GoogleAdsAuth.findById(id);
  } catch (err) {
    console.log("There was an error with the request.", err);
    return res
      .status(500)
      .json({ message: "There was an error with the request." });
  }

  if (!user) {
    return res
      .status(404)
      .json({ message: "Could not find user by the given id." });
  }

  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccessToken = decryptData(user.access_token);

  const merchId = await getMerchantCenterId(
    decryptedRefreshToken,
    accountId as string
  );

  const productIds = await getProductIdsForBrand(
    `${merchId}`,
    brand as string,
    decryptedAccessToken,
    decryptedRefreshToken
  );

  const client = getClient();

  const customer = client.Customer({
    customer_id: `${accountId}`,
    refresh_token: decryptedRefreshToken,
  });

  let activeProducts;

  const productIdsList = productIds
    ?.map((id) => `'${id?.toLowerCase()}'`)
    .join(", ");
  let lowerCaseBrand = brand as string;
  lowerCaseBrand = lowerCaseBrand.toLowerCase();
  // console.log("LowerCase", lowerCaseBrand);
  // console.log("PRODUCTS", productIdsList);

  const query = `
        SELECT
        segments.product_item_id, 
        segments.product_brand,
        segments.product_title,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM shopping_performance_view
      WHERE segments.product_item_id IN (${productIdsList})
      `;

  try {
    activeProducts = await customer.query(query);
    //console.log(activeProducts);
  } catch (err) {
    // console.log(err, "in product-performance-reports");
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
  }

  res.status(200).json({ productPerformance: activeProducts });
}
