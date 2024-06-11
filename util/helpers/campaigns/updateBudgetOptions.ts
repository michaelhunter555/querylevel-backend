import {
  Customer,
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  services,
  toMicros,
} from "google-ads-api";

import { UpdateCampaignBudget } from "../../../types";
import { googleError } from "../googleError";

//update budget resource
export const createUpdatedBudgetResource = (
  customer: Customer,
  campaignId: string,
  resourceName: string
): MutateOperation<services.CampaignOperation> => {
  const updateCampaignBudget = new resources.Campaign({
    resource_name: `customers/${customer.credentials.customer_id}/campaigns/${campaignId}`,
    campaign_budget: resourceName,
  });

  return {
    entity: "campaign",
    operation: "update",
    resource: updateCampaignBudget,
    update_mask: {
      paths: ["campaign_budget"],
    },
  };
};

export const createIndividualBudgetResource = async (
  customer: Customer,
  deliveryMethod: number,
  budget: number
) => {
  const newBudgetResource = ResourceNames.campaignBudget(
    customer.credentials.customer_id,
    -1
  );
  //create new individual budget
  const createBudget: MutateOperation<resources.ICampaignBudget> = {
    entity: "campaign_budget",
    operation: "create",
    resource: {
      resource_name: newBudgetResource,
      name: "standard budget",
      amount_micros: toMicros(Number(budget)),
      delivery_method: deliveryMethod,
      explicitly_shared: false,
    },
  };

  try {
    const result = await customer.mutateResources([createBudget]);
    const individualBudgetResource =
      result.mutate_operation_responses[0]?.campaign_budget_result
        ?.resource_name;
    return individualBudgetResource;
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    throw new Error("Error creating individual BudgetResource" + err);
  }
};

export const updateBudgetData = (
  newBudgetData: UpdateCampaignBudget
): MutateOperation<services.CampaignBudgetOperation> => {
  const budgetSettings = new Set([
    "resource_name",
    "explicitly_shared",
    "amount_micros",
    "delivery_method",
  ]);

  const budgetSettingEntries = Object.entries(newBudgetData).filter(
    ([key, value]) => budgetSettings.has(key) && !!value
  );

  const updatedBudgetFields = budgetSettingEntries.reduce(
    (acc: { [key: string]: string | number | boolean }, [key, value]) => {
      if (
        key &&
        typeof key === "string" &&
        ((value && typeof value === "number") ||
          typeof value === "string" ||
          typeof value === "boolean")
      ) {
        acc[key] = value as string | number | boolean;
      }
      return acc;
    },
    {}
  );
  //maybe need to create a new resource
  const budgetUpdates = new resources.CampaignBudget({
    //check if budgetresource is valid as it could also be just other settings being updated
    resource_name: newBudgetData?.resource_name,
    amount_micros: toMicros(Number(updatedBudgetFields.amount_micros)),
    delivery_method: Number(updatedBudgetFields.delivery_method),
    explicitly_shared: updatedBudgetFields.explicitly_shared as boolean,
  });

  return {
    entity: "campaign_budget",
    operation: "update",
    resource: budgetUpdates,
    update_mask: {
      paths: Object.keys(updatedBudgetFields),
    },
  };
};

export const updateCampaignResourceOperation = (
  customer: Customer,
  campaignId: string,
  campaignBudgetResource: string
): MutateOperation<services.CampaignOperation> => {
  // update campaign resource with new individual budget
  const updateCampaignResource = new resources.Campaign({
    resource_name: ResourceNames.campaign(
      customer.credentials.customer_id,
      campaignId as string
    ),
    campaign_budget: campaignBudgetResource,
  });

  return {
    entity: "campaign",
    operation: "update",
    resource: updateCampaignResource,
    update_mask: {
      paths: ["campaign_budget"],
    },
  };
};
