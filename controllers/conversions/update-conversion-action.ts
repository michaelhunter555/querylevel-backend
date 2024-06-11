import { Request, Response } from "express";
import {
  errors,
  MutateOperation,
  ResourceNames,
  services,
} from "google-ads-api";

import { updateConversionAction } from "../../lib/conversionAction/updateConversionAction";
import { getClient } from "../../lib/getClient";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { googleError } from "../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { newConversionData, conversionId } = req.body;

  const user = await findGoogleAuthById(id as string, res);

  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  const conversionResourceName = ResourceNames.conversionAction(
    customer.credentials.customer_id,
    conversionId
  );

  const newConversion = updateConversionAction(
    newConversionData,
    conversionResourceName
  );

  const updateConversionMutation: MutateOperation<services.ConversionActionOperation>[] =
    [];

  const hasValues = Object.entries(newConversion).reduce(
    (acc: { [key: string]: any }, [key, value]) => {
      if (
        key &&
        typeof key === "string" &&
        (typeof value === "string" || typeof value === "number")
      ) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );

  if (Object.entries(hasValues).length > 0) {
    const updateConversionOperation: MutateOperation<services.ConversionActionOperation> =
      {
        entity: "conversion_action",
        operation: "update",
        resource: newConversion,
        update_mask: {
          paths: [...Object.keys(newConversionData)],
        },
      };

    updateConversionMutation.push(updateConversionOperation);
  }

  //console.log("TEST: ", updateConversionMutation);
  try {
    await customer.mutateResources(updateConversionMutation);
    res
      .status(201)
      .json({ message: "successfully remove conversion action(s).", ok: true });
    //console.log("Sucess");
  } catch (err) {
    //console.log("NO SUCCESS FOR YOU!!!", err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    return res.status(500).json({
      message: "There was an error creating the conversion action.",
      ok: false,
    });
  }
}
