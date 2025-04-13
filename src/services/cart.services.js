import CartDaoMongoDB from "../daos/cart.dao.js"
import ProductDaoMongoDB from "../daos/product.dao.js"

const cartDao = new CartDaoMongoDB()
const productDao = new ProductDaoMongoDB()

/**
 * Obtiene todos los carritos
 * @returns {Promise<Array>} Lista de carritos
 */
export const getAll = async () => {
  try {
    return await cartDao.getAll()
  } catch (error) {
    console.error("Error en getAll:", error.message)
    throw new Error(`Error al obtener carritos: ${error.message}`)
  }
}

/**
 * Obtiene un carrito por su ID
 * @param {string} id - ID del carrito
 * @returns {Promise<Object>} Carrito encontrado
 */
export const getById = async (id) => {
  try {
    const cart = await cartDao.getById(id)
    return cart
  } catch (error) {
    console.error("Error en getById:", error.message)
    throw new Error(`Error al obtener carrito por ID: ${error.message}`)
  }
}

/**
 * Crea un nuevo carrito
 * @returns {Promise<Object>} Carrito creado
 */
export const create = async () => {
  try {
    const newCart = await cartDao.create()
    return newCart
  } catch (error) {
    console.error("Error en create:", error.message)
    throw new Error(`Error al crear carrito: ${error.message}`)
  }
}

/**
 * Actualiza un carrito existente
 * @param {string} id - ID del carrito
 * @param {Object} cartData - Datos actualizados del carrito
 * @returns {Promise<Object>} Carrito actualizado
 */
export const update = async (id, cartData) => {
  try {
    const updatedCart = await cartDao.update(id, cartData)
    return updatedCart
  } catch (error) {
    console.error("Error en update:", error.message)
    throw new Error(`Error al actualizar carrito: ${error.message}`)
  }
}

/**
 * Elimina un carrito
 * @param {string} id - ID del carrito
 * @returns {Promise<Object>} Carrito eliminado
 */
export const remove = async (id) => {
  try {
    const deletedCart = await cartDao.delete(id)
    return deletedCart
  } catch (error) {
    console.error("Error en remove:", error.message)
    throw new Error(`Error al eliminar carrito: ${error.message}`)
  }
}

/**
 * Agrega un producto al carrito
 * @param {string} cartId - ID del carrito
 * @param {string} prodId - ID del producto
 * @returns {Promise<Object>} Carrito actualizado
 */
export const addProdToCart = async (cartId, prodId) => {
  try {
    // Verificar que exista el carrito
    const existCart = await getById(cartId)
    if (!existCart) {
      throw new Error(`Carrito con ID ${cartId} no encontrado`)
    }

    // Verificar que exista el producto
    const existProd = await productDao.getById(prodId)
    if (!existProd) {
      throw new Error(`Producto con ID ${prodId} no encontrado`)
    }

    return await cartDao.addProdToCart(cartId, prodId)
  } catch (error) {
    console.error("Error en addProdToCart:", error.message)
    throw new Error(`Error al agregar producto al carrito: ${error.message}`)
  }
}

/**
 * Elimina un producto del carrito
 * @param {string} cartId - ID del carrito
 * @param {string} prodId - ID del producto
 * @returns {Promise<Object>} Carrito actualizado
 */
export const removeProdFromCart = async (cartId, prodId) => {
  try {
    // Verificar que exista el carrito
    const existCart = await getById(cartId)
    if (!existCart) {
      throw new Error(`Carrito con ID ${cartId} no encontrado`)
    }

    // Verificar que el producto exista en el carrito
    const existProdInCart = await cartDao.existProdInCart(cartId, prodId)
    if (!existProdInCart) {
      throw new Error(`Producto con ID ${prodId} no encontrado en el carrito`)
    }

    return await cartDao.removeProdFromCart(cartId, prodId)
  } catch (error) {
    console.error("Error en removeProdFromCart:", error.message)
    throw new Error(`Error al eliminar producto del carrito: ${error.message}`)
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 * @param {string} cartId - ID del carrito
 * @param {string} prodId - ID del producto
 * @param {number} quantity - Nueva cantidad
 * @returns {Promise<Object>} Carrito actualizado
 */
export const updateProdQuantity = async (cartId, prodId, quantity) => {
  try {
    // Verificar que exista el carrito
    const existCart = await getById(cartId)
    if (!existCart) {
      throw new Error(`Carrito con ID ${cartId} no encontrado`)
    }

    // Verificar que el producto exista en el carrito
    const existProdInCart = await cartDao.existProdInCart(cartId, prodId)
    if (!existProdInCart) {
      throw new Error(`Producto con ID ${prodId} no encontrado en el carrito`)
    }

    // Verificar que la cantidad sea válida
    if (quantity < 1) {
      throw new Error("La cantidad debe ser al menos 1")
    }

    return await cartDao.updateProdQuantity(cartId, prodId, quantity)
  } catch (error) {
    console.error("Error en updateProdQuantity:", error.message)
    throw new Error(`Error al actualizar cantidad de producto: ${error.message}`)
  }
}

/**
 * Vacía un carrito
 * @param {string} cartId - ID del carrito
 * @returns {Promise<Object>} Carrito vacío
 */
export const clearCart = async (cartId) => {
  try {
    // Verificar que exista el carrito
    const existCart = await getById(cartId)
    if (!existCart) {
      throw new Error(`Carrito con ID ${cartId} no encontrado`)
    }

    return await cartDao.clearCart(cartId)
  } catch (error) {
    console.error("Error en clearCart:", error.message)
    throw new Error(`Error al vaciar el carrito: ${error.message}`)
  }
}

/**
 * Procesa la compra de un carrito
 * @param {string} cartId - ID del carrito
 * @returns {Promise<Object>} Carrito procesado
 */
export const purchaseCart = async (cartId) => {
  try {
    // Verificar que exista el carrito
    const existCart = await getById(cartId)
    if (!existCart) {
      throw new Error(`Carrito con ID ${cartId} no encontrado`)
    }

    // Verificar que el carrito tenga productos
    if (existCart.products.length === 0) {
      throw new Error("El carrito está vacío")
    }

    return await cartDao.purchaseCart(cartId)
  } catch (error) {
    console.error("Error en purchaseCart:", error.message)
    throw new Error(`Error al procesar la compra: ${error.message}`)
  }
}
