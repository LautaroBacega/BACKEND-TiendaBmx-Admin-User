import express from "express";
import { adminMiddleware, authenticateJWT, authMiddleware } from "../middleware/auth.middleware.js";
import { createOrder, getAllOrders, getOrderById, getUserOrders } from "../controllers/order.controller.js";


const router = express.Router();

router.post("/", authenticateJWT, createOrder);
router.get("/:id", authenticateJWT, getOrderById);
router.get('/user/:userId', authenticateJWT, getUserOrders)
router.get("/", authenticateJWT, getAllOrders);

export default router;