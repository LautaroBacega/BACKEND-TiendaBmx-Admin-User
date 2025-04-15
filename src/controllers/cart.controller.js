import * as cartService from "../services/cart.services.js"
import * as userService from "../services/user.services.js"

/**
 * Crea un nuevo carrito
 */
export const createCart = async (req, res) => {
  try {
    const newCart = await cartService.create()
    res.status(201).json(newCart)
  } catch (error) {
    console.error("Error en createCart:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene todos los carritos
 */
export const getAllCarts = async (req, res) => {
  try {
    const carts = await cartService.getAll()
    res.status(200).json(carts)
  } catch (error) {
    console.error("Error en getAllCarts:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene el carrito del usuario autenticado
 */
export const getCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const user = await userService.getById(req.user.id)

    if (!user || !user.cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    const cart = await cartService.getById(user.cart)
    res.status(200).json(cart)
  } catch (error) {
    console.error("Error en getCart:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene un carrito por su ID
 */
export const getCartById = async (req, res) => {
  try {
    const { id } = req.params
    const cart = await cartService.getById(id)

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    res.status(200).json(cart)
  } catch (error) {
    console.error("Error en getCartById:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Agrega un producto al carrito del usuario
 */
export const addToCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ error: "Se requiere el ID del producto" })
    }

    const user = await userService.getById(req.user.id)

    if (!user || !user.cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    const updatedCart = await cartService.addProdToCart(user.cart, productId)
    res.status(200).json({ message: "Producto agregado al carrito", cart: updatedCart })
  } catch (error) {
    console.error("Error en addToCart:", error.message)

    if (error.message.includes("stock")) {
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: error.message })
  }
}

/**
 * Elimina un producto del carrito
 */
export const removeProductFromCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const { prodId } = req.params
    const user = await userService.getById(req.user.id)

    if (!user || !user.cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    const updatedCart = await cartService.removeProdFromCart(user.cart, prodId)
    res.status(200).json({ message: "Producto eliminado del carrito", cart: updatedCart })
  } catch (error) {
    console.error("Error en removeProductFromCart:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Vacía el carrito del usuario
 */
export const clearCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const user = await userService.getById(req.user.id)

    if (!user || !user.cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    await cartService.clearCart(user.cart)
    res.status(200).json({ message: "Carrito vaciado correctamente" })
  } catch (error) {
    console.error("Error en clearCart:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export const updateProductQuantity = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const { prodId } = req.params
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "La cantidad debe ser al menos 1" })
    }

    const user = await userService.getById(req.user.id)

    if (!user || !user.cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    const updatedCart = await cartService.updateProdQuantity(user.cart, prodId, quantity)
    res.status(200).json({ message: "Cantidad actualizada", cart: updatedCart })
  } catch (error) {
    console.error("Error en updateProductQuantity:", error.message)

    if (error.message.includes("stock")) {
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: error.message })
  }
}
