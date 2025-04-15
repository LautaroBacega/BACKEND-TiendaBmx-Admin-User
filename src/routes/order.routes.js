import express from "express"
import { authenticateJWT, adminMiddleware } from "../middleware/auth.middleware.js"
import * as orderController from "../controllers/order.controller.js"

const router = express.Router()

// Crear una nueva orden
router.post("/", authenticateJWT, orderController.createOrder)

// Obtener una orden por ID (modificada para permitir acceso sin autenticación para debugging)
router.get("/:id", orderController.getOrderById)

// Obtener órdenes de un usuario
router.get("/user/:userId", authenticateJWT, orderController.getUserOrders)

// Obtener todas las órdenes (solo admin)
router.get("/", authenticateJWT, adminMiddleware, orderController.getAllOrders)

// Actualizar estado de una orden
router.put("/:id/status", authenticateJWT, adminMiddleware, orderController.updateOrderStatus)

// Actualizar estado de pago
router.put("/:id/payment", authenticateJWT, adminMiddleware, orderController.updatePaymentStatus)

// Generar factura
router.get("/:id/invoice", authenticateJWT, orderController.generateInvoice)

// Exportar todas las órdenes
router.get("/export/all", authenticateJWT, adminMiddleware, orderController.exportAllOrders)

export default router
