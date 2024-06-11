import { errors } from "google-ads-api";

export async function googleError(err: errors.GoogleAdsFailure) {
  console.log(
    "GoogleError.ts - Field Path Property",
    err.errors.map((err) => err.location)
  );
  console.log(
    "GoogleError.ts Field Path Map",
    err.errors.map((err) =>
      err.location?.field_path_elements?.map((err) => err)
    )
  );

  console.log(
    "errorCode: ",
    err.errors.map((err) => err.error_code)
  );

  console.log(
    "GoogleError.ts - Trigger:",
    err.errors.map((err) => err?.trigger)
  );
}
