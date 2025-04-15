import OrderDaoMongoDB from "../daos/order.dao.js"
import CartDaoMongoDB from "../daos/cart.dao.js"
import UserDaoMongoDB from "../daos/user.dao.js"

const orderDao = new OrderDaoMongoDB()
const cartDao = new CartDaoMongoDB()
const userDao = new UserDaoMongoDB()

/**
 * Obtiene todas las órdenes
 * @returns {Promise<Array>} Lista de órdenes
 */
export const getAll = async () => {
  try {
    return await orderDao.getAll()
  } catch (error) {
    console.error("Error en getAll:", error.message)
    throw new Error(`Error al obtener órdenes: ${error.message}`)
  }
}

/**
 * Obtiene una orden por su ID
 * @param {string} id - ID de la orden
 * @returns {Promise<Object>} Orden encontrada
 */
export const getById = async (id) => {
  try {
    const order = await orderDao.getById(id)
    return order
  } catch (error) {
    console.error("Error en getById:", error.message)
    throw new Error(`Error al obtener orden por ID: ${error.message}`)
  }
}

/**
 * Obtiene las órdenes de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de órdenes del usuario
 */
export const getByUser = async (userId) => {
  try {
    // Verificar que exista el usuario
    const user = await userDao.getById(userId)
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`)
    }

    const orders = await orderDao.getByUser(userId)
    return orders
  } catch (error) {
    console.error("Error en getByUser:", error.message)
    throw new Error(`Error al obtener órdenes del usuario: ${error.message}`)
  }
}

/**
 * Crea una nueva orden a partir de un carrito
 * @param {string} userId - ID del usuario
 * @param {string} cartId - ID del carrito
 * @param {Object} shippingInfo - Información de envío
 * @returns {Promise<Object>} Orden creada
 */
export const createFromCart = async (userId, cartId, shippingInfo) => {
  try {
    // Verificar que exista el usuario
    const user = await userDao.getById(userId)
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`)
    }

    // Verificar que exista el carrito
    const cart = await cartDao.getById(cartId)
    if (!cart) {
      throw new Error(`Carrito con ID ${cartId} no encontrado`)
    }

    // Verificar que el carrito tenga productos
    if (cart.products.length === 0) {
      throw new Error("El carrito está vacío")
    }

    // Calcular el monto total
    let totalAmount = 0
    const orderProducts = cart.products.map((item) => {
      const itemTotal = item.price * item.quantity
      totalAmount += itemTotal

      return {
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      }
    })

    // Crear la orden
    const orderData = {
      user: userId,
      products: orderProducts,
      shippingInfo,
      totalAmount,
      paymentStatus: "pendiente",
      orderStatus: [{ status: "creado" }],
    }

    // Procesar la compra (actualizar stock)
    await cartDao.purchaseCart(cartId)

    // Crear la orden
    const newOrder = await orderDao.create(orderData)

    // Vaciar el carrito
    await cartDao.clearCart(cartId)

    return newOrder
  } catch (error) {
    console.error("Error en createFromCart:", error.message)
    throw new Error(`Error al crear orden desde carrito: ${error.message}`)
  }
}

/**
 * Actualiza el estado de una orden
 * @param {string} orderId - ID de la orden
 * @param {string} newStatus - Nuevo estado
 * @param {string} trackingNumber - Número de seguimiento (opcional)
 * @param {string} shippingCompany - Empresa de envío (opcional)
 * @returns {Promise<Object>} Orden actualizada
 */
export const updateStatus = async (orderId, newStatus, trackingNumber, shippingCompany) => {
  try {
    const updateOps = {
      $push: {
        orderStatus: {
          status: newStatus,
          timestamp: new Date(),
        },
      },
    }

    if (trackingNumber || shippingCompany) {
      updateOps.$set = {}
      if (trackingNumber) updateOps.$set["shippingInfo.trackingNumber"] = trackingNumber
      if (shippingCompany) updateOps.$set["shippingInfo.shippingCompany"] = shippingCompany
    }

    return await orderDao.updateStatus(orderId, newStatus, updateOps)
  } catch (error) {
    console.error("Error en updateStatus:", error.message)
    throw new Error(`Error al actualizar estado de la orden: ${error.message}`)
  }
}

/**
 * Actualiza el estado de pago de una orden
 * @param {string} orderId - ID de la orden
 * @param {string} paymentStatus - Nuevo estado de pago
 * @returns {Promise<Object>} Orden actualizada
 */
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    // Verificar que el estado de pago sea válido
    const validPaymentStatuses = ["pendiente", "completado", "rechazado"]
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new Error(`Estado de pago inválido. Debe ser uno de: ${validPaymentStatuses.join(", ")}`)
    }

    return await orderDao.updatePaymentStatus(orderId, paymentStatus)
  } catch (error) {
    console.error("Error en updatePaymentStatus:", error.message)
    throw new Error(`Error al actualizar estado de pago: ${error.message}`)
  }
}

/**
 * Elimina una orden
 * @param {string} id - ID de la orden
 * @returns {Promise<Object>} Orden eliminada
 */
export const remove = async (id) => {
  try {
    const deletedOrder = await orderDao.delete(id)
    return deletedOrder
  } catch (error) {
    console.error("Error en remove:", error.message)
    throw new Error(`Error al eliminar orden: ${error.message}`)
  }
}
