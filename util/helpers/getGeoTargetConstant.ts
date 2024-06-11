export const getGeoTargetConstant = async (
  customer: any,
  location: string
): Promise<string> => {
  const query = `
    SELECT geo_target_constant.resource_name
    FROM geo_target_constant
    WHERE geo_target_constant.name = '${location}'
    `;
  try {
    const response = await customer.report(query);
    return response[0]?.geo_target_constant?.resource_name || "";
  } catch (err) {
    console.log("Error with geoTargetConst", err);
    throw new Error("Error with GeoTargetConstant");
  }
};
