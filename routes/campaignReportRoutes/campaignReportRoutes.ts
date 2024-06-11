import { Router } from "express";

import biddingStrategyPerformanceMetrics from "../../controllers/reports/bidding-strategy-performance-metrics";
import campaignLevelMetrics from "../../controllers/reports/campaign-level-metrics";
import customerMetrics from "../../controllers/reports/customer-metrics";
import productPartitionMetrics from "../../controllers/reports/product-partition-metrics";
import productPerformanceReports from "../../controllers/reports/product-performance-reports";
import searchTermViewMetrics from "../../controllers/reports/search-term-view-metrics";
import shoppingPerformanceMetrics from "../../controllers/reports/shopping-performance-metrics";

const router = Router();

router.get(
  "/bidding-strategy-performance-metrics",
  biddingStrategyPerformanceMetrics
);
router.get("/campaign-level-metrics", campaignLevelMetrics);
router.get("/customer-metrics", customerMetrics);
router.get("/product-partition-metrics", productPartitionMetrics);
router.get("/product-performance-reports", productPerformanceReports);
router.get("/search-term-view-metrics", searchTermViewMetrics);
router.get("/shopping-performance-metrics", shoppingPerformanceMetrics);

export default router;
