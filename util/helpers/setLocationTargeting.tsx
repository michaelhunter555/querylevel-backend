import { LocationSettings } from "../../types";

export const setLocationSettings = async (
  customer: any,
  location: LocationSettings[]
): Promise<void> => {
  const locationCriteria = location.map((settings) => ({
    campaign: settings.campaign,
    criterion: {
      location: {
        geo_target_constant: settings.locationResourceName,
      },
    },
    negative: settings.isNegative || false,
  }));

  try {
    await customer.campaignCriteria.create(locationCriteria);
  } catch (err) {
    console.log("There was an error with the location criteria setting", err);
    throw new Error("There was an error with the location criteria setting");
  }
};
