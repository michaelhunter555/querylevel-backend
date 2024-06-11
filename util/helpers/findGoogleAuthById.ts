import { Response } from "express";

import GoogleAdsAuth from "../../models/GoogleAdsAuth";

export const findGoogleAuthById = async (id: string, res: Response) => {
  let user;

  try {
    user = await GoogleAdsAuth.findById(id);
  } catch (err) {
    console.log("There was an error with the request to find user by id.", err);
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return user;
};
// { refreshToken: user.refresh_token, accountId: user.googleAccountId }
