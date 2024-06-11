import { MutateOperation, resources } from "google-ads-api";

export const geoTargetService = (
  customer: string,
  targetedLocations: any[],
  index: number,
  arr: MutateOperation<resources.ICampaignCriterion>[]
) => {
  return targetedLocations.forEach((location: any) =>
    arr.push({
      entity: "campaign_criterion",
      operation: "create",
      resource: {
        campaign: `customers/${customer}/campaigns/${-3 - index}`,
        ...location,
      },
    })
  );
};
