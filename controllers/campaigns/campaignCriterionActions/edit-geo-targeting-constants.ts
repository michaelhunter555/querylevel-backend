import { Request, Response } from "express";
import {
  errors,
  MutateOperation,
  ResourceNames,
  resources,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { currentLocations, targetedLocations, excludedLocations, campaignId } =
    req.body;

  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user?.refresh_token);
  const accountId = decryptData(user?.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const removeOperationArray: string[] = [];
  currentLocations.forEach((location: string) => {
    const locationId = location.split("/")[1];
    const geoLocationResource = ResourceNames.campaignCriterion(
      customer.credentials.customer_id,
      campaignId,
      locationId
    );
    removeOperationArray.push(geoLocationResource);
  });

  const createIndexGenerator = () => {
    let index = -1;
    return () => index--;
  };

  const createUniqueId = createIndexGenerator();
  const campaignResource = ResourceNames.campaign(
    customer.credentials.customer_id,
    campaignId
  );

  const handleLocation = (
    locations: string[],
    isExcluded: boolean
  ): MutateOperation<resources.ICampaignCriterion>[] => {
    return locations.map((location) => {
      const locationId = location.split(":")[1];
      const tempCriterionResourceName = ResourceNames.campaignCriterion(
        customer.credentials.customer_id,
        campaignId,
        createUniqueId()
      );
      const geoTargetResourceName = ResourceNames.geoTargetConstant(locationId);

      const createNewLocationResource = new resources.CampaignCriterion({
        campaign: campaignResource,
        location: {
          geo_target_constant: geoTargetResourceName,
        },
        negative: isExcluded,
      });

      return {
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          ...createNewLocationResource,
        },
      };
    });
  };

  const geoTargetedLocations = handleLocation(targetedLocations, false);
  const excludedGeoTargetLocations = handleLocation(excludedLocations, true);

  // console.log(
  //   "Operations",
  //   removeOperationArray,
  //   geoTargetedLocations,
  //   excludedGeoTargetLocations
  // );

  try {
    if (removeOperationArray.length > 0) {
      await customer.campaignCriteria.remove(removeOperationArray);
    }

    const operations = [...geoTargetedLocations, ...excludedGeoTargetLocations];

    if (operations.length > 0) {
      await customer.mutateResources(operations);
    }
    res
      .status(201)
      .json({ message: "successfully updated geo target settings.", ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      message: "Error with the request to update location settings.",
      ok: false,
    });
  }
}
