import { MutateOperation, resources } from "google-ads-api";

export const adScheduleService = (
  customer: string,
  adSchedule: any[],
  index: number,
  arr: MutateOperation<resources.ICampaignCriterion>[]
) => {
  adSchedule?.forEach((schedule: any) => {
    arr.push({
      entity: "campaign_criterion",
      operation: "create",
      resource: {
        campaign: `customers/${customer}/campaigns/${-3 - index}`,
        ad_schedule: schedule,
      },
    });
  });
};
