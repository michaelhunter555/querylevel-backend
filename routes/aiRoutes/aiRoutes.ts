import { Router } from "express";

import analyzeData from "../../controllers/queryAi/analyze-data";
import deleteFeedback from "../../controllers/queryAi/delete-feedback";
import getPastFeedback from "../../controllers/queryAi/get-past-feedback";

const router = Router();

router.get("/analyze-data", analyzeData);
router.get("/get-past-ai-feedback", getPastFeedback);
router.delete("/delete-feedback", deleteFeedback);

export default router;
