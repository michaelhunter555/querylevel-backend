import { Request, Response } from "express";

import QueryGPT from "../../models/QueryGPT";
import { decryptData } from "../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../util/helpers/findGoogleAuthById";

export default async function (req: Request, res: Response) {
  const { id, page, limit } = req.query;

  const pageNum: number = Math.max(parseInt(String(page), 1), 1) || 1;
  const limitNum: number = Math.max(parseInt(String(limit), 10), 10) || 10;

  try {
    const user = await findGoogleAuthById(String(id), res);
    //get response and break down how many we'll grab
    const queryAiResponses = await QueryGPT.find({ userId: String(id) })
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    //if no feedback res a 404
    if (!queryAiResponses) {
      return res
        .status(404)
        .json({ error: "No QueryAI feedback found for this user" });
    }

    //calculate total pages for pagination
    const totalFeedback = await QueryGPT.countDocuments({
      userId: String(id),
    });
    const totalPages = Math.ceil(totalFeedback / limitNum);

    //list only needs id and date, use id to retrieve specific response
    const gptData = queryAiResponses?.map((queryData, i) => {
      const decryptedResponse = decryptData(queryData.response);
      return {
        date: queryData.date,
        id: queryData._id,
        response: decryptedResponse,
      };
    });

    res.status(200).json({
      gptData,
      pageNum,
      totalPages,
      totalFeedback,
      gptQuota: user?.gptQuota,
      ok: true,
    });
  } catch (err) {
    res.status(500).json({
      error: "an error occured returning your feedback " + err,
      ok: false,
    });
  }
}
