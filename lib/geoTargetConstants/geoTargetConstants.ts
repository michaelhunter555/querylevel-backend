//targetlocations where we want to serve our shopping ads
export const geoTargetConstant = (
  targetedLocations: string[],
  negative: boolean
) => {
  return targetedLocations.map((location: string) => ({
    location: {
      geo_target_constant: `geoTargetConstants/${location.split(":")[1]}`,
    },
    negative: negative, // false if targeted, true if excluded
  }));
};
