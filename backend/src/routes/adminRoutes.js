const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/adminController");

const router = express.Router();
router.use(authMiddleware, requireRole("admin"));

router.get("/admin/users", asyncHandler(controller.listUsers));
router.post("/admin/update-wallet", asyncHandler(controller.updateWallet));
router.post("/admin/toggle-user", asyncHandler(controller.toggleUser));
router.get("/admin/deposits", asyncHandler(controller.listDeposits));
router.post("/admin/approve-deposit", asyncHandler(controller.approveDeposit));
router.get("/admin/withdraws", asyncHandler(controller.listWithdraws));
router.post("/admin/approve-withdraw", asyncHandler(controller.approveWithdraw));
router.post("/admin/update-stock", asyncHandler(controller.updateStock));

module.exports = router;
