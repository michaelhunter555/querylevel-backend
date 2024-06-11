import { Request, Response } from "express";
import { errors, MutateOperation, services } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import {
  createIndividualBudgetResource,
  createUpdatedBudgetResource,
  updateBudgetData,
  updateCampaignResourceOperation,
} from "../../../util/helpers/campaigns/updateBudgetOptions";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id, campaignId } = req.query;
  const { newBudgetData, currentBudgetData } = req.body; // {key: value}

  const user = await findGoogleAuthById(id as string, res);
  const decryptedAccountId = decryptData(user.googleAccountId);
  const decryptedRefreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: decryptedAccountId,
    refresh_token: decryptedRefreshToken,
  });

  //switch shared budgets but need to check if it has changed otherwise no point in this
  //this should also cover if user switches from individual to shared budget
  if (
    newBudgetData?.resource_name &&
    newBudgetData?.resource_name !== currentBudgetData.resource_name
  ) {
    const updateBudget: MutateOperation<services.CampaignOperation> =
      createUpdatedBudgetResource(
        customer,
        campaignId as string,
        newBudgetData?.resource_name
      );

    try {
      await customer.mutateResources([updateBudget]);
      // console.log("updated budget resource successful");
      res
        .status(200)
        .json({ message: "Switching shared budgets was successful." });
    } catch (err) {
      res.status(500).json({ message: "Error updating budget" });
    }
    //Shared budget may not have changed but user can still indicate they want to change budget type
    //handle shared to individual budget. 1st if covers if vice-versa (individual to shared).
  } else if (
    newBudgetData?.explicitly_shared === false &&
    currentBudgetData?.explicitly_shared === true
  ) {
    try {
      const createIndividualBudget = await createIndividualBudgetResource(
        customer,
        Number(newBudgetData.delivery_method),
        newBudgetData.amount_micros
      );
      // update campaign resource with new individual budget
      const updateCampaignOperation: MutateOperation<services.CampaignOperation> =
        updateCampaignResourceOperation(
          customer,
          campaignId as string,
          createIndividualBudget as string
        );
      //update campaign_budget
      await customer.mutateResources([updateCampaignOperation]);
      //console.log(" create new individual budget & update budget successful");
      res.status(200).json({ message: "Success in updating budget" });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ message: "There was an error with the request. " });
    }
    //if resource has not changed & explicity_shared has not changed => check if amount_micros or delivery_method has changed
    //this suggests a minor update
  } else {
    const budgetUpdateOperation: MutateOperation<services.CampaignBudgetOperation> =
      updateBudgetData(newBudgetData);

    try {
      await customer.mutateResources([budgetUpdateOperation]);
      //console.log("update budget successful");
      res.status(200).json({ message: "Update Campaign Budget Successful" });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      return res
        .status(500)
        .json({ error: "There was an error updating the campaign." });
    }
  }
}
