import { Request, Response } from "express";
import { errors, ResourceNames } from "google-ads-api";

import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { conversionIds } = req.body;

  const user = await findGoogleAuthById(id as string, res);

  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const removeOperation: string[] = [];

  if (conversionIds.length > 0) {
    conversionIds.forEach((id: string) => {
      const resourceName = ResourceNames.conversionAction(
        customer?.credentials?.customer_id,
        id
      );
      removeOperation.push(resourceName);
    });
  }

  try {
    //.log("MutateOperation: ", removeOperation);
    await customer.conversionActions.remove(removeOperation);
    res
      .status(201)
      .json({ message: "successfully remove conversion action(s).", ok: true });
    //console.log("Sucess");
  } catch (err) {
    console.log("NO SUCCESS FOR YOU!!!", err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res.status(500).json({
      message: "There was an error creating the conversion action.",
      ok: false,
    });
  }
}
