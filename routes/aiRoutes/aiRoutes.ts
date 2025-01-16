import { Router } from "express";

import analyzeData from "../../controllers/queryAi/analyze-data";
import getPastFeedback from "../../controllers/queryAi/get-past-feedback";

const router = Router();

router.get("/analyze-data", analyzeData);
router.get("/get-past-ai-feedback", getPastFeedback);

export default router;
