import { Request, Response } from "express";
import { enums, errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

interface ISegments {
  [key: string]: string | undefined; // Index signature
  product_title: string; // And other known properties
}

export default async function (req: Request, res: Response) {
  const { id, filterSegment } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  let availableProducts;
  try {
    const queryData = `
          SELECT
              segments.${filterSegment},
              segments.product_title
          FROM
              shopping_performance_view
          `;
    availableProducts = await customer.query(queryData);
    const map = new Map();

    availableProducts.forEach((segment: any, index: number) => {
      const segmentTitle = segment?.segments[filterSegment as string];
      const title = segment?.segments?.product_title;

      if (segmentTitle && title) {
        if (!map.has(segmentTitle)) {
          map.set(segmentTitle, new Set());
        }
        map.get(segmentTitle).add(title);
      }
    });

    let segments: string;
    const segmentsAndTitles = Array.from(map).map(([segmentTitle, titles]) => {
      segments = segmentTitle;

      if (filterSegment === "product_channel") {
        segments = enums.ProductChannel[segmentTitle];
      }

      if (filterSegment === "product_condition") {
        segments = enums.ProductCondition[segmentTitle];
      }

      return {
        segmentTitle: segments,
        titles: titles.size,
      };
    });

    res.status(200).json({ productsAvailable: segmentsAndTitles });
  } catch (err) {
    console.error(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
  }
}
/**
 * product_type,
    product_channel,
    product_condition,
    produt_item_id,
    product_custom_attribute0,
    product_custom_attribute1,
    product_custom_attribute2,
    product_custom_attribute3,
    product_custom_attribute4,
 */
