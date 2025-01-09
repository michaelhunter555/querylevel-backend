import { Router } from "express";

import createShoppingPromotion from "../../controllers/promotions/create-shopping-promotion";
import getShoppingPromotions from "../../controllers/promotions/get-shopping-promotions";

const router = Router();

router.get("/get-promotions", getShoppingPromotions);

router.post("/create-promotion", createShoppingPromotion);

export default router;
