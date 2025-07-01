import { Router } from "express";

import searchTermServiceOperation from "../../controllers/searchTermService/search-term-service-operation";

const router = Router();

router.post("/clean-up", searchTermServiceOperation);

export default router;
