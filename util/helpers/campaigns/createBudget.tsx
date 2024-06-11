import { Budget } from "../../../types";

export const createBudget = async (
  customer: any,
  budget: Budget
): Promise<string> => {
  try {
    const response = await customer.campaignBudgets.create([budget]);
    return response?.results[0]?.resource_name;
  } catch (err) {
    console.log("Error Creating budget", err);
    throw new Error("Error creating budget.");
  }
};
