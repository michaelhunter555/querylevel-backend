import { MutateOperation, ResourceNames, resources } from "google-ads-api";

/**
 * @name removeResources
 * @param customer
 * @param campaignId
 * @param ids
 * @param arr
 * @result - push all ids into desired array used for remove operations on ad schedule
 */
export const removeResources = (
  customer: string,
  campaignId: string | number,
  ids: number[],
  arr: string[]
) => {
  return ids?.forEach((id: number) => {
    const resources = ResourceNames.campaignCriterion(customer, campaignId, id);
    arr.push(resources);
  });
};

const timeMap = {
  "00": 2,
  "15": 3,
  "30": 4,
  "45": 5,
};

const convertSpecialDays: Record<number, number[]> = {
  9: [2, 3, 4, 5, 6],
  10: [7, 8],
  11: [2, 3, 4, 5, 6, 7, 8],
};

const createListOfDays = (day: number) => {
  return convertSpecialDays[day] || [];
};

/**
 * @param customer
 * @param campaignId
 * @param tempId
 * @name createSchedule
 * @param selectedDay
 * @param startTime
 * @param endTime
 * @param campaignResourceName
 * @result creates an operation-ready mutate object for each ad schedule segment
 */
export const createSchedule = (
  customer: string,
  campaignId: string | number,
  tempId: () => number,
  selectedDay: number,
  startTime: string,
  endTime: string,
  campaignResourceName: string
): MutateOperation<resources.ICampaignCriterion> => {
  const startHour = parseInt(startTime.split(":")[0], 10);
  const startMinute = startTime.split(":")[1];
  const endHour = parseInt(endTime.split(":")[0], 10);
  const endMinute = endTime.split(":")[1];
  const tempResourceName = ResourceNames.campaignCriterion(
    customer,
    campaignId,
    tempId()
  );

  const scheduleResource = new resources.CampaignCriterion({
    //resource_name: tempResourceName,
    campaign: campaignResourceName,
    ad_schedule: {
      day_of_week: selectedDay,
      start_hour: startHour,
      start_minute: timeMap[startMinute as keyof typeof timeMap],
      end_hour: endHour,
      end_minute: timeMap[endMinute as keyof typeof timeMap],
    },
  });

  return {
    entity: "campaign_criterion",
    operation: "create",
    resource: scheduleResource,
  };
};

/**
 *
 * @param customer
 * @param campaignId
 * @param tempId
 * @param selectedDay
 * @param startTime
 * @param endTime
 * @param arr
 * @result uses selectedDay to determine the # of operations to perform (i.e. mon-fri) or single day segments and adds each object to operation array
 * @example - if mon-fri (9), 5 operations will be created for that day segment. If just mon (2), then only one needs to be created.
 */
export const createNewTempResource = (
  customer: string,
  campaignId: string | number,
  tempId: () => number,
  selectedDay: number,
  startTime: string,
  endTime: string,
  arr: MutateOperation<resources.ICampaignCriterion>[]
) => {
  const bulkDays = createListOfDays(selectedDay);
  //console.log("bulk days:", bulkDays);

  const campaignResourceName = ResourceNames.campaign(customer, campaignId);

  if (bulkDays.length > 0) {
    bulkDays.forEach((day) => {
      const schedules = createSchedule(
        customer,
        campaignId,
        tempId,
        day,
        startTime,
        endTime,
        campaignResourceName
      );
      arr.push(schedules);
    });
  } else {
    const schedule = createSchedule(
      customer,
      campaignId,
      tempId,
      selectedDay,
      startTime,
      endTime,
      campaignResourceName
    );
    arr.push(schedule);
  }
};
