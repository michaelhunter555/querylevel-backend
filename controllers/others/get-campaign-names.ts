import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  const user = await findGoogleAuthById(id as string, res);

  if (!user.googleAccountId) {
    return res
      .status(400)
      .json({ message: "Google Id account not found", noAccountId: true });
  }

  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedGoogleAccountId = decryptData(user.googleAccountId);

  const client = getClient();

  const customer = client.Customer({
    customer_id: `${decryptedGoogleAccountId}`,
    refresh_token: decryptedRefreshToken,
  });

  const query = `
    SELECT
    campaign.id,
    campaign.name,
    campaign.status,
    campaign.advertising_channel_type
    FROM
    campaign
    WHERE
    campaign.advertising_channel_type = 'SHOPPING'
    AND campaign.status = 'ENABLED'
    `;

  let result;
  try {
    result = await customer.query(query);
    const names = result?.map((campaign) => {
      const name = campaign?.campaign?.name;
      const id = campaign?.campaign?.id;

      return `${name}:${id}`;
    });
    const campaignNames = [...new Set(names)];

    res.status(200).json({ campaignNames: campaignNames });
  } catch (err) {
    console.log("There was an error with the query.", err);
    let googleErrorMessage = "An unknown Error has occurred. Please try again.";
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
      googleErrorMessage = err?.errors[0]?.message || googleErrorMessage;
    }
    res.status(500).json({ message: googleErrorMessage, ok: false });
  }
}
