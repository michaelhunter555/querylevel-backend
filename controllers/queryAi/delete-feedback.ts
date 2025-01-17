import { Request, Response } from "express";
import mongoose from "mongoose";

import QueryGPT from "../../models/QueryGPT";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

export default async function (req: Request, res: Response) {
  const { id, feedbackId } = req.query;

  try {
    await QueryGPT.findOneAndDelete({ _id: feedbackId });
    const user = await findGoogleAuthById(String(id), res);

    user.AIFeedback = user.AIFeedback.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== feedbackId
    );
    await user.save();

    res.status(200).json({ message: "item has been deleted", ok: true });
  } catch (err) {
    console.error("Error deleting feedback:", err);
    res.status(500).json({ error: "error deleting feedback", ok: false });
  }
}
