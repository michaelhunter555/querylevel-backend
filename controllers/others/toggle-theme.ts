import { Request, Response } from "express";

import GoogleAdsAuth from "../../models/GoogleAdsAuth";

export default async function (req: Request, res: Response) {
  const { id, theme } = req.body;

  let user;

  try {
    user = await GoogleAdsAuth.findByIdAndUpdate(
      id,
      { theme: theme },
      { new: true }
    );
  } catch (err) {
    console.log("Error finding user by id", err);
    return res
      .status(500)
      .json({ message: "Error finding user by id during request." });
  }

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.json({ theme: theme });
}
