import { Request, Response } from "express";

import { getClient } from "../../lib/getClient";
import GoogleAdsAuth from "../../models/GoogleAdsAuth";
import { decryptData } from "../../util/encryption/decryptData";

export default async function (req: Request, res: Response) {
  const { locationQuery, accountId, id } = req.body;

  let user;

  try {
    user = await GoogleAdsAuth.findById(id);
  } catch (err) {
    console.log("get-us-states-query-ts error", err);
    return res.status(500).json({
      message:
        "Error with the request to by user by id in get-us-states-query.",
    });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: `${accountId}`,
    refresh_token: decryptedRefreshToken,
  });

  const query = `
      SELECT
      geo_target_constant.canonical_name,
      geo_target_constant.name,
      geo_target_constant.id,
      geo_target_constant.country_code
      FROM geo_target_constant
      WHERE geo_target_constant.target_type = 'Country' AND geo_target_constant.country_code = 'US'
      `;

  try {
    const states = await customer.query(query);
    //console.log("US STATES:", states);
    res.status(200).json({ states: states });
  } catch (err) {
    console.log("Error trying to query for states data", err);
    res
      .status(500)
      .json({ message: "Error trying to query for states data." + err });
  }
}
