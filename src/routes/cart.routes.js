import express from "express"
import { authenticateJWT } from "../middleware/auth.middleware.js"
import * as cartController from "../controllers/cart.controller.js"

const router = express.Router()

// Crear un carrito
router.post("/", cartController.createCart)

// Obtener todos los carritos
router.get("/all", cartController.getAllCarts)

// Obtener el carrito del usuario autenticado
router.get("/", authenticateJWT, cartController.getCart)

// Obtener un carrito por ID
router.get("/:id", cartController.getCartById)

// Agregar productos al carrito (protegida)
router.post("/add", authenticateJWT, cartController.addToCart)

// Eliminar producto del carrito
router.delete("/:id/remove-product/:prodId", authenticateJWT, cartController.removeProductFromCart)

// Actualizar cantidad de producto en el carrito
router.put("/:id/update-quantity/:prodId", authenticateJWT, cartController.updateProductQuantity)

// Vaciar carrito
router.delete("/", authenticateJWT, cartController.clearCart)

export default router
