import { Request, Response } from "express";
import {
  errors,
  MutateOperation,
  ResourceNames,
  resources,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { createProductInventoryFilter } from "../../../lib/InventoryFilter/inventoryFilter";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { currentScopeId, newListingScope, campaignId, shouldRemove } =
    req.body;

  // console.log(
  //   "operation: ",
  //   currentScopeId,
  //   newListingScope,
  //   campaignId,
  //   shouldRemove
  // );

  const user = await findGoogleAuthById(id as string, res);
  const accountId = decryptData(user.googleAccountId);
  const refreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });
  const finalArray: MutateOperation<resources.ICampaignCriterion>[] = [];
  const removeCriterionResource: string[] = [];

  const currentScopeResourceName = ResourceNames.campaignCriterion(
    customer.credentials.customer_id,
    campaignId,
    currentScopeId
  );

  const scopeCriteria = newListingScope.split("=");
  const criteriaIsValid =
    scopeCriteria[0] !== undefined && scopeCriteria[1] !== undefined;

  const shouldCreateListingScope =
    newListingScope && criteriaIsValid && shouldRemove;

  if (!shouldRemove) {
    if (currentScopeId) {
      removeCriterionResource.push(currentScopeResourceName);
    }
  } else {
    if (currentScopeId) {
      removeCriterionResource.push(currentScopeResourceName);
    }

    if (shouldCreateListingScope) {
      createProductInventoryFilter(
        customer.credentials.customer_id,
        1,
        finalArray,
        newListingScope,
        "create",
        campaignId
      );
    }
  }

  try {
    if (removeCriterionResource.length > 0) {
      // console.log("removed", removeCriterionResource);
      await customer.campaignCriteria.remove(removeCriterionResource);
    }
    if (finalArray.length > 0) {
      await customer.mutateResources([...finalArray]);
      // console.log("Operation Successful", finalArray);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: "There was an error adding an inventoryFilter",
      ok: false,
    });
  }
}
