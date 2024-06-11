import { Router } from "express";

import createConversionAction from "../../controllers/conversions/create-conversion-action";
import removeConversionAction from "../../controllers/conversions/remove-conversion-action";
import updateConversionAction from "../../controllers/conversions/update-conversion-action";

const router = Router();

router.post("/create-conversion-action", createConversionAction);
router.post("/remove-conversion-action", removeConversionAction);
router.post("/update-conversion-action", updateConversionAction);

export default router;
