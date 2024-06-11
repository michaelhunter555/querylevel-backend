import { enums } from "google-ads-api";

import { MinuteShortHands, NonNullScheduleItem, ScheduleItem } from "@/types";

//Pre-set times which google accepts.
const minuteMapping: Record<
  NonNullScheduleItem["start_minute" | "end_minute"],
  number
> = {
  ZERO: enums.MinuteOfHour.ZERO,
  FIFTEEN: enums.MinuteOfHour.FIFTEEN,
  THIRTY: enums.MinuteOfHour.THIRTY,
  FORTY_FIVE: enums.MinuteOfHour.FORTY_FIVE,
};

export const createAdSchedule = (adSchedule: ScheduleItem[]) => {
  return Object.values(adSchedule)
    ?.filter(
      (schedule): schedule is NonNullable<typeof schedule> => schedule !== null
    )
    .map((schedule) => ({
      day_of_week: schedule?.day_of_week,
      start_hour: schedule?.start_hour,
      start_minute: minuteMapping[schedule?.start_minute as MinuteShortHands],
      end_hour: schedule?.end_hour,
      end_minute: minuteMapping[schedule?.end_minute as MinuteShortHands],
    }));
};
