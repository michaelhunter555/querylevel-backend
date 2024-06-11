import { Request, Response } from "express";
import { errors, MutateOperation, resources } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import {
  createNewTempResource,
  removeResources,
} from "../../../util/helpers/campaignCriterion/adScheduleHelpers";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

type ScheduleData = Record<
  string,
  {
    startTime: string;
    endTime: string;
    ids?: number[];
    day?: number | number[];
  }
>;

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { currentScheduleData, newScheduleData, campaignId } = req.body;

  // console.log(currentScheduleData);
  // console.log(newScheduleData);
  //get user data
  const user = await findGoogleAuthById(id as string, res);
  const accountId = decryptData(user.googleAccountId);
  const refreshToken = decryptData(user.refresh_token);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  //ads customer id
  const customerId = customer.credentials.customer_id;

  //entries of both new and old schedules to compare
  const currentSchedule = Object.entries(currentScheduleData as ScheduleData);
  const newSchedule = Object.entries(newScheduleData as ScheduleData);

  //operation arrays
  const newAdScheduleOperation: MutateOperation<resources.ICampaignCriterion>[] =
    [];
  const removeCriterionId: string[] = [];

  //decrementation handling for tempId
  let tempResourceId = -1;
  const tempIdDecrementer = () => {
    return () => tempResourceId--;
  };
  let tempId = tempIdDecrementer();

  //make sure the newSchedule has length
  if (newSchedule.length > 0) {
    //create map to compare current schedule with the new one
    const map = new Map();
    currentSchedule?.forEach(([timeKey, details]) => {
      if (details && typeof details === "object") {
        map.set(timeKey, { ...details });
      }
    });
    //create newSchedule map to check later for selective deletion
    const newScheduleMap = new Map(
      newSchedule.map((item) => [item[0], item[1]])
    );

    //loop over new Schedule and see if there are timeKey matches
    //if there are it means we want to edit an existing time segment
    newSchedule?.forEach(([timeKey, schedule]) => {
      const { startTime, endTime, day, ids } = schedule;
      const currentTimeKeyData = map.get(timeKey);

      if (map.has(timeKey)) {
        //if anything is changed, we need to remove it all
        const scheduleWasChanged =
          startTime !== currentTimeKeyData.startTime ||
          endTime !== currentTimeKeyData.endTime ||
          day !== currentTimeKeyData.day;
        // console.log("I found a timeKey!");
        if (scheduleWasChanged) {
          //  console.log("I removed resources");
          //remove all ids related this to changed resource as ad_schedule is immutable
          removeResources(
            customerId,
            campaignId,
            ids as number[],
            removeCriterionId
          );
          //create new resource(s)
          createNewTempResource(
            customerId,
            campaignId,
            tempId,
            day as number,
            startTime,
            endTime,
            newAdScheduleOperation
          );
        }
      } else {
        //it means a new unique key was generated so its a newly added resource
        createNewTempResource(
          customerId,
          campaignId,
          tempId,
          day as number,
          startTime,
          endTime,
          newAdScheduleOperation
        );
      }
    });

    //check if any items have been removed. if the new schedule no long has those time keys we should remove them
    //first if check only checks if an existing time key was edited, not removed.
    //example:  removed 9:00 - 10:00 and added 2 new segments of 11:00 - 12:00.
    // we should delete the segments that are no longer included in the new schedule

    if (currentSchedule.length > 0) {
      currentSchedule?.forEach(([timeKey, currentSchedule]) => {
        if (!newScheduleMap.has(timeKey)) {
          const { ids } = currentSchedule;
          removeResources(
            customerId,
            campaignId,
            ids as number[],
            removeCriterionId
          );
        }
      });
    }
  } else {
    //if our array.length === 0, it means delete all schedules
    currentSchedule?.forEach(([timeKey, currentSchedule]) => {
      removeResources(
        customerId,
        campaignId,
        currentSchedule.ids as number[],
        removeCriterionId
      );
    });
  }

  try {
    //console.log("new schedule", newAdScheduleOperation);
    //console.log("remove array", removeCriterionId);
    //only run if there are ids to remove
    if (removeCriterionId?.length > 0) {
      await customer.campaignCriteria.remove(removeCriterionId);
    }

    //only run if there are new resources to create
    if (newAdScheduleOperation?.length > 0) {
      await customer.mutateResources(newAdScheduleOperation);
    }
    res
      .status(201)
      .json({ ok: false, message: "Successfully updated schedules" });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res.status(500).json({
      ok: false,
      message: "Failed to update schedule. Please check for time conflicts.",
    });
  }
}
