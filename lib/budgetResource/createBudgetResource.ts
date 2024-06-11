import { ResourceNames, toMicros } from "google-ads-api";

interface CreateBudgetResource {
  name: string;
  amountMicros: number;
  deliveryMethod: number;
  explicitlyShared: boolean;
}

export const createCampaignBudget = (
  customer: string,
  budget: CreateBudgetResource
) => {
  const budgetResource = ResourceNames.campaignBudget(customer, -1);

  return {
    resource_name: budgetResource,
    name: budget?.name,
    amount_micros: toMicros(Number(budget?.amountMicros)),
    delivery_method: budget?.deliveryMethod,
    explicitly_shared: budget?.explicitlyShared,
  };
};
