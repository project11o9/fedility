const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  getWallet,
  createDeposit,
  createWithdraw
} = require("../controllers/walletController");

const router = express.Router();

router.get("/wallet", authMiddleware, asyncHandler(getWallet));
router.post("/deposit", authMiddleware, asyncHandler(createDeposit));
router.post("/withdraw", authMiddleware, asyncHandler(createWithdraw));

module.exports = router;
