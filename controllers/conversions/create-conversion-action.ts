import { Request, Response } from "express";
import { errors, MutateOperation, resources } from "google-ads-api";

import { createConversionAction } from "../../lib/conversionAction/createConversionAction";
import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { conversionData } = req.body;

  const user = await findGoogleAuthById(id as string, res);

  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const createConversionOperation = createConversionAction(conversionData);

  const conversionOperation: MutateOperation<resources.IConversionAction> = {
    entity: "conversion_action",
    operation: "create",
    resource: createConversionOperation,
  };

  try {
    //console.log("MutateOperation: ", conversionOperation);
    await customer.mutateResources([conversionOperation]);
    res
      .status(201)
      .json({ message: "successfully created conversion action.", ok: true });
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
