export const createTargetRoasStrategy = (
  customer: string,
  strategyName: string,
  targetRoasValue: number
) => ({
  resource_name: `customers/${customer}/BiddingStrategies/${-2}`,
  name: strategyName,
  type: "TARGET_ROAS",
  target_roas: {
    target_roas: targetRoasValue,
  },
});
