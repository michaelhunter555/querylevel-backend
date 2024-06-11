import { errors, resources } from "google-ads-api";

import { googleError } from "../googleError";

export const createCampaign = async (
  customer: any,
  campaign: resources.Campaign[]
): Promise<any> => {
  try {
    return await customer.campaigns.create(campaign);
  } catch (err) {
    console.log("Error creating Campaign", err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    throw new Error("Error creating Campaign");
  }
};
