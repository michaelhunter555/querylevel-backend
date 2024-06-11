import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";
import { productGroupViewQuery } from "../../util/queries/queries";

export default async function (req: Request, res: Response) {
  const { id, segment, status, adGroupId } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  const query = productGroupViewQuery(
    status as string,
    segment as string,
    Number(adGroupId)
  );

  try {
    const productGroupView = await customer.query(query);
    // console.log(
    //   "PRODUCT PARTITION METRICS.ts",
    //   productGroupView.map((val) => {
    //     return {
    //       ...val.ad_group_criterion,
    //       ...val.ad_group_criterion?.listing_group,
    //       ...val.ad_group_criterion?.listing_group?.case_value,
    //     };
    //   })
    // );
    res.status(200).json({ productGroupView });
    //console.log("Reports/ProductPartitions RAN");
  } catch (err) {
    console.log(err);

    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res.status(500).json({
      message:
        "There was an error with the query in Product-Partition-Metrics.",
    });
  }
}
