import { OrderModel } from "./models/order.model.js"
import { userModel } from "./models/user.model.js"

export default class OrderDaoMongoDB {
  async getAll() {
    try {
      return await OrderModel.find()
        .populate("user", "nombre apellido email")
        .populate("products.product")
        .sort({ createdAt: -1 })
    } catch (error) {
      throw new Error(`Error al obtener todas las órdenes: ${error.message}`)
    }
  }

  async getById(id) {
    try {
      const order = await OrderModel.findById(id).populate("user", "nombre apellido email").populate("products.product")

      if (!order) {
        throw new Error(`Orden con ID ${id} no encontrada`)
      }

      return order
    } catch (error) {
      throw new Error(`Error al obtener la orden: ${error.message}`)
    }
  }

  async getByUser(userId) {
    try {
      return await OrderModel.find({ user: userId }).populate("products.product").sort({ createdAt: -1 })
    } catch (error) {
      throw new Error(`Error al obtener órdenes del usuario: ${error.message}`)
    }
  }

  async create(orderData) {
    try {
      const newOrder = await OrderModel.create(orderData)

      // Actualizar el usuario con la referencia a la nueva orden
      await userModel.findByIdAndUpdate(orderData.user, { $push: { orders: newOrder._id } })

      return newOrder
    } catch (error) {
      throw new Error(`Error al crear la orden: ${error.message}`)
    }
  }

  async updateStatus(orderId, newStatus, additionalOps = {}) {
    try {
      const baseUpdate = {
        $push: {
          orderStatus: {
            status: newStatus,
            timestamp: new Date(),
          },
        },
      }

      // Merge the base update with any additional operations
      const updateOps = { ...baseUpdate }
      if (additionalOps.$set) updateOps.$set = additionalOps.$set

      return await OrderModel.findByIdAndUpdate(orderId, updateOps, { new: true })
        .populate("user", "nombre apellido email")
        .populate("products.product")
    } catch (error) {
      throw new Error(`Error al actualizar el estado de la orden: ${error.message}`)
    }
  }

  async delete(id) {
    try {
      const order = await OrderModel.findById(id)
      if (!order) {
        throw new Error(`Orden con ID ${id} no encontrada`)
      }

      // Eliminar la referencia de la orden en el usuario
      await userModel.findByIdAndUpdate(order.user, { $pull: { orders: id } })

      return await OrderModel.findByIdAndDelete(id)
    } catch (error) {
      throw new Error(`Error al eliminar la orden: ${error.message}`)
    }
  }
}
