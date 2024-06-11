import { Request, Response } from "express";

import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";
import { getMerchantCenterId } from "../../util/helpers/getMerchantCenterId";

export default async function (req: Request, res: Response) {
  const { id } = req.query;

  let user = await findGoogleAuthById(id as string, res);

  const decryptedRefreshToken = decryptData(user.refresh_token);
  const decryptedAccountId = decryptData(user.googleAccountId);

  const merchantCenterId = await getMerchantCenterId(
    decryptedRefreshToken,
    decryptedAccountId
  );

  res.status(200).json({ resourceNames: merchantCenterId });
}
