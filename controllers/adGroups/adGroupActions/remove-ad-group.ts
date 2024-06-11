import { Request, Response } from "express";
import { errors, ResourceNames } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { adGroups } = req.body;

  //find user and prepare credentials
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  //prepare client for instance
  const client = getClient();
  const customer = client.Customer({
    refresh_token: refreshToken,
    customer_id: accountId,
  });

  const removeAdGroupsOperation: string[] = [];

  if (adGroups.length > 0) {
    adGroups?.forEach((id: string) => {
      const adGroupResourceNames = ResourceNames.adGroup(
        customer?.credentials?.customer_id,
        id
      );
      removeAdGroupsOperation.push(adGroupResourceNames);
    });

    //console.log("Removed: ", removeAdGroupsOperation);

    try {
      await customer.adGroups.remove([...removeAdGroupsOperation]);
      //console.log("Successfully Removed ad groups.");
      res
        .status(200)
        .json({ message: "Successfully removed ad group(s)", ok: true });
    } catch (err) {
      console.log(err);
      if (err instanceof errors.GoogleAdsFailure) {
        googleError(err);
      }
      res
        .status(500)
        .json({ message: "Operation Failed to remove ad group(s)", ok: false });
    }
  }
}
