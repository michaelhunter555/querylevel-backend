import { Request, Response } from "express";
import { errors } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import GoogleAdsAuth from "../../models/GoogleAdsAuth";
import { decryptData } from "../../util/encryption/decryptData";
import { encryptData } from "../../util/encryption/encryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  const googleUser = await findGoogleAuthById(id as string, res);

  const decryptedRefreshToken = decryptData(googleUser.refresh_token);

  const client = getClient();

  let resources;
  try {
    resources = await client.listAccessibleCustomers(decryptedRefreshToken);
  } catch (err) {
    console.log(
      "There was an error finding accessible customers lists in get-resource-names.ts",
      err
    );
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res
      .status(500)
      .json({ message: "Error finding list of resource names", err });
  }

  const resourceName = resources.resource_names
    .map((resource) => resource.split("/")[1])
    .join("");

  const encryptedResourceName = encryptData(resourceName);

  try {
    await GoogleAdsAuth.findByIdAndUpdate(id, {
      googleAccountId: encryptedResourceName,
    });
  } catch (err) {
    console.log("Error updating googleAccountId", err);
    return res.status(500).json({ message: "Error updating googleAccountId" });
  }

  res.status(200).json({ ok: true, resourceName: resourceName });
}
