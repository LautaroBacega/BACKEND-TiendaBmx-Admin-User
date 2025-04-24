import express from "express"
import { authenticateJWT, adminMiddleware } from "../middleware/auth.middleware.js"
import * as userController from "../controllers/user.controller.js"

const router = express.Router()

router.get("/users", authenticateJWT, adminMiddleware, userController.getUsers)
router.put("/users/update", authenticateJWT, userController.updateUser)
router.put("/users/shipping", authenticateJWT, userController.updateShippingInfo)
router.get("/users/:id", authenticateJWT, userController.getUserById)

export default router
