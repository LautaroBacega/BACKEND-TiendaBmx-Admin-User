import { userModel } from "./models/user.model.js"
import { CartModel } from "./models/cart.model.js"

export default class UserDaoMongoDB {
  async getAll() {
    try {
      return await userModel.find().populate("cart").populate("orders")
    } catch (error) {
      throw new Error(`Error al obtener los usuarios: ${error.message}`)
    }
  }

  async getById(id) {
    try {
      const user = await userModel.findById(id).populate("cart").populate("orders")
      if (!user) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }
      return user
    } catch (error) {
      throw new Error(`Error al obtener el usuario: ${error.message}`)
    }
  }

  async getByEmail(email) {
    try {
      return await userModel.findOne({ email }).populate("cart")
    } catch (error) {
      throw new Error(`Error al buscar el usuario por email: ${error.message}`)
    }
  }

  async getByGoogleId(googleId) {
    try {
      return await userModel.findOne({ googleId }).populate("cart")
    } catch (error) {
      throw new Error(`Error al buscar el usuario por Google ID: ${error.message}`)
    }
  }

  async create(userData) {
    try {
      // Crear un carrito vacío para el nuevo usuario
      const newCart = await CartModel.create({ products: [] })

      // Asignar el carrito al usuario
      const newUser = await userModel.create({
        ...userData,
        cart: newCart._id,
      })

      return newUser
    } catch (error) {
      throw new Error(`Error al crear el usuario: ${error.message}`)
    }
  }

  async update(id, userData) {
    try {
      const updatedUser = await userModel.findByIdAndUpdate(id, userData, { new: true })

      if (!updatedUser) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      return updatedUser
    } catch (error) {
      throw new Error(`Error al actualizar el usuario: ${error.message}`)
    }
  }

  async updateShippingInfo(id, shippingInfo) {
    try {
      const updatedUser = await userModel.findByIdAndUpdate(
        id,
        {
          nombre: shippingInfo.nombre,
          apellido: shippingInfo.apellido,
          provincia: shippingInfo.provincia,
          ciudad: shippingInfo.ciudad,
          calle: shippingInfo.calle,
          altura: shippingInfo.altura,
          codigoPostal: shippingInfo.codigoPostal,
          phone: shippingInfo.phone,
        },
        { new: true },
      )

      if (!updatedUser) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      return updatedUser
    } catch (error) {
      throw new Error(`Error al actualizar la información de envío: ${error.message}`)
    }
  }

  async delete(id) {
    try {
      const user = await userModel.findById(id)
      if (!user) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      // Eliminar el carrito asociado al usuario
      if (user.cart) {
        await CartModel.findByIdAndDelete(user.cart)
      }

      return await userModel.findByIdAndDelete(id)
    } catch (error) {
      throw new Error(`Error al eliminar el usuario: ${error.message}`)
    }
  }
}
