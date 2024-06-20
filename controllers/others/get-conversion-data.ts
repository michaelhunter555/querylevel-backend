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
  conversion_action.attribution_model_settings.attribution_model, 
  conversion_action.attribution_model_settings.data_driven_model_status, 
  conversion_action.category, 
  conversion_action.counting_type, 
  conversion_action.click_through_lookback_window_days, 
  conversion_action.id, 
  conversion_action.name, 
  conversion_action.origin, 
  conversion_action.status, 
  conversion_action.primary_for_goal, 
  conversion_action.type, 
  conversion_action.view_through_lookback_window_days, 
  conversion_action.tag_snippets, 
  conversion_action.value_settings.always_use_default_value,
  conversion_action.value_settings.default_value,
  conversion_action.phone_call_duration_seconds,
  metrics.all_conversions 
FROM conversion_action 
WHERE 
  conversion_action.type IN ('WEBPAGE', 'WEBSITE_CALL') 
  `;

  try {
    const result = await customer.query(query);
    res.status(200).json({ conversionData: result, ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({ ok: false });
  }
}
