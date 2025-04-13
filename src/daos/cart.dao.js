import { CartModel } from "./models/cart.model.js"
import { ProductModel } from "./models/product.model.js"

export default class CartDaoMongoDB {
  async create() {
    try {
      return await CartModel.create({
        products: [],
      })
    } catch (error) {
      throw new Error(`Error al crear el carrito: ${error.message}`)
    }
  }

  async getAll() {
    try {
      return await CartModel.find({}).populate("products.product")
    } catch (error) {
      throw new Error(`Error al obtener todos los carritos: ${error.message}`)
    }
  }

  async getById(id) {
    try {
      const cart = await CartModel.findById(id).populate("products.product")
      if (!cart) {
        throw new Error(`Carrito con ID ${id} no encontrado`)
      }
      return cart
    } catch (error) {
      throw new Error(`Error al obtener el carrito: ${error.message}`)
    }
  }

  async delete(id) {
    try {
      const deletedCart = await CartModel.findByIdAndDelete(id)
      if (!deletedCart) {
        throw new Error(`Carrito con ID ${id} no encontrado`)
      }
      return deletedCart
    } catch (error) {
      throw new Error(`Error al eliminar el carrito: ${error.message}`)
    }
  }

  async existProdInCart(cartId, prodId) {
    try {
      return await CartModel.findOne({
        _id: cartId,
        "products.product": prodId,
      })
    } catch (error) {
      throw new Error(`Error al verificar producto en carrito: ${error.message}`)
    }
  }

  async addProdToCart(cartId, prodId) {
    try {
      // Paso 1: Obtener el producto y verificar stock
      const product = await ProductModel.findById(prodId)
      if (!product) {
        throw new Error("Producto no encontrado")
      }

      // Verificación de stock base
      if (product.stock < 1) {
        throw new Error("Producto sin stock")
      }

      // Paso 2: Obtener precio actual
      const price = product.precioOferta || product.precioBase

      // Paso 3: Verificar si el producto ya está en el carrito
      const cartWithProduct = await this.existProdInCart(cartId, prodId)

      if (cartWithProduct) {
        // Encontrar el producto específico en el carrito
        const productInCart = cartWithProduct.products.find((item) => item.product.toString() === prodId.toString())

        // Validación de stock al incrementar cantidad
        const nuevaCantidad = productInCart.quantity + 1
        if (product.stock < nuevaCantidad) {
          throw new Error("Stock insuficiente para agregar más unidades")
        }

        // Actualizar cantidad y precio (si cambió)
        return await CartModel.findOneAndUpdate(
          { _id: cartId, "products.product": prodId },
          {
            $set: {
              "products.$.quantity": nuevaCantidad,
              "products.$.price": price,
            },
          },
          { new: true },
        ).populate("products.product")
      } else {
        // Agregar nuevo producto con precio
        return await CartModel.findByIdAndUpdate(
          cartId,
          {
            $push: {
              products: {
                product: prodId,
                quantity: 1,
                price: price,
              },
            },
          },
          { new: true },
        ).populate("products.product")
      }
    } catch (error) {
      throw new Error(`Error al agregar producto al carrito: ${error.message}`)
    }
  }

  async removeProdFromCart(cartId, prodId) {
    try {
      const updatedCart = await CartModel.findByIdAndUpdate(
        cartId,
        { $pull: { products: { product: prodId } } },
        { new: true },
      ).populate("products.product")

      if (!updatedCart) {
        throw new Error(`Carrito con ID ${cartId} no encontrado`)
      }

      return updatedCart
    } catch (error) {
      throw new Error(`Error al eliminar producto del carrito: ${error.message}`)
    }
  }

  async update(id, cartData) {
    try {
      const updatedCart = await CartModel.findByIdAndUpdate(id, cartData, { new: true }).populate("products.product")

      if (!updatedCart) {
        throw new Error(`Carrito con ID ${id} no encontrado`)
      }

      return updatedCart
    } catch (error) {
      throw new Error(`Error al actualizar el carrito: ${error.message}`)
    }
  }

  async updateProdQuantity(cartId, prodId, quantity) {
    try {
      // Verificar que la cantidad sea válida
      if (quantity < 1) {
        throw new Error("La cantidad debe ser al menos 1")
      }

      // Verificar stock disponible
      const product = await ProductModel.findById(prodId)
      if (!product) {
        throw new Error("Producto no encontrado")
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles`)
      }

      // Actualizar precio por si ha cambiado
      const price = product.precioOferta || product.precioBase

      const updatedCart = await CartModel.findOneAndUpdate(
        { _id: cartId, "products.product": prodId },
        {
          $set: {
            "products.$.quantity": quantity,
            "products.$.price": price,
          },
        },
        { new: true },
      ).populate("products.product")

      if (!updatedCart) {
        throw new Error("No se pudo actualizar la cantidad del producto")
      }

      return updatedCart
    } catch (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`)
    }
  }

  async clearCart(cartId) {
    try {
      const updatedCart = await CartModel.findByIdAndUpdate(cartId, { $set: { products: [] } }, { new: true })

      if (!updatedCart) {
        throw new Error(`Carrito con ID ${cartId} no encontrado`)
      }

      return updatedCart
    } catch (error) {
      throw new Error(`Error al vaciar el carrito: ${error.message}`)
    }
  }

  async purchaseCart(cartId) {
    try {
      const cart = await CartModel.findById(cartId).populate("products.product")
      if (!cart) {
        throw new Error(`Carrito con ID ${cartId} no encontrado`)
      }

      // Verificar stock suficiente para todos los productos
      for (const item of cart.products) {
        const product = await ProductModel.findById(item.product)
        if (!product) {
          throw new Error(`Producto con ID ${item.product} no encontrado`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.modelo}. Disponible: ${product.stock}`)
        }
      }

      // Actualizar stock de todos los productos
      for (const item of cart.products) {
        await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      }

      return cart
    } catch (error) {
      throw new Error(`Error al procesar la compra: ${error.message}`)
    }
  }
}
