import express from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { createOrder, getOrderById, getUserOrders } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", authenticateJWT, createOrder);
router.get("/:id", authenticateJWT, getOrderById);

router.get('/user/:userId', authenticateJWT, getUserOrders)

export default router;