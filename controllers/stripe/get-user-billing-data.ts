import { Request, Response } from "express";

import StripeBilling from "../../models/Billing";

export default async function (req: Request, res: Response) {
  const { stripeCustomerId, page, limit } = req.query;

  const pageNum: number = Math.max(parseInt(page as string, 10), 1) || 1;
  const pageLimit: number = Math.max(parseInt(limit as string, 10), 10) || 10;

  try {
    const stripeCustomer = await StripeBilling.find({
      stripeCustomerId: stripeCustomerId as string,
    })
      .sort({ periodStart: -1 })
      .skip((pageNum - 1) * pageLimit)
      .limit(pageLimit);

    if (!stripeCustomer) {
      return res
        .status(404)
        .json({ message: "Customer billing data not found.", ok: false });
    }

    const totalCharges = await StripeBilling.countDocuments({
      stripeCustomerId: stripeCustomerId,
    });

    res.status(200).json({
      charges: stripeCustomer,
      currentChargePage: pageNum,
      totalChargesPages: Math.ceil(totalCharges / pageLimit),
      totalCharges,
    });
  } catch (err) {
    res.status(500).json({ message: "An error has occured " + err, ok: false });
  }
}
