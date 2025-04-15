import express from "express"
import { authenticateJWT, adminMiddleware } from "../middleware/auth.middleware.js"
import * as userController from "../controllers/user.controller.js"

const router = express.Router()

// Rutas específicas primero
router.get("/users", authenticateJWT, adminMiddleware, userController.getUsers)
router.put("/users/update", authenticateJWT, userController.updateUser)
router.put("/users/shipping", authenticateJWT, userController.updateShippingInfo)

// Ruta con parámetro al final
router.get("/users/:id", authenticateJWT, userController.getUserById)

export default router
