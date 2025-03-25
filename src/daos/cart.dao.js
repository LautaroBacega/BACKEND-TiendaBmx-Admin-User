import { CartModel } from "./models/cart.model.js";
import { ProductModel } from "./models/product.model.js";

export default class CartDaoMongoDB {

  async create() {
    try {
      return await CartModel.create({
        products: [],
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getAll() {
    try {
      return await CartModel.find({});
    } catch (error) {
      throw new Error("Error al obtener todos los carritos")
    }
  }

  async getById(id) {
      try {
        const cart = await CartModel.findById(id).populate("products.product");
        if (!cart) {
          console.log(`Cart with ID ${id} not found`);
        }
        return cart;
      } catch (error) {
        console.error(`Error fetching cart with ID ${id}:`, error);
        throw new Error("Error retrieving cart");
      }
  }

  async delete(id) {
    try {
      return await CartModel.findByIdAndDelete(id);
    } catch (error) {
      console.log(error);
    }
  }

  async existProdInCart(cartId, prodId){
    try {
      return await CartModel.findOne({
        _id: cartId,
        products: { $elemMatch: { product: prodId } }
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async addProdToCart(cartId, prodId) {
    try {
      // Paso 1: Obtener el producto y verificar stock
      const product = await ProductModel.findById(prodId);
      if (!product) throw new Error("Producto no encontrado");
      
      // Verificación de stock base
      if (product.stock < 1) {
        throw new Error("Producto sin stock");
      }
  
      // Paso 2: Obtener precio actual
      const price = product.precioOferta || product.precioBase;
  
      // Paso 3: Verificar si el producto ya está en el carrito
      const existProdInCart = await this.existProdInCart(cartId, prodId);
      
      if (existProdInCart) {
        // Validación de stock al incrementar cantidad
        const nuevaCantidad = existProdInCart.products[0].quantity + 1;
        if (product.stock < nuevaCantidad) {
          throw new Error("Stock insuficiente para agregar más unidades");
        }

        // Actualizar cantidad y precio (si cambió)
        return await CartModel.findOneAndUpdate(
          { _id: cartId, 'products.product': prodId },
          { 
            $set: { 
              'products.$.quantity': nuevaCantidad,
              'products.$.price': price
            } 
          },
          { new: true }
        ).populate("products.product");
      } else {
        // Agregar nuevo producto con precio
        return await CartModel.findByIdAndUpdate(
          cartId,
          { $push: { 
            products: { 
              product: prodId, 
              quantity: 1, 
              price: price 
            } 
          }},
          { new: true }
        ).populate("products.product");
      }
    } catch (error) {
      console.error(`Error en addProdToCart: ${error.message}`);
      throw new Error(`No se pudo agregar el producto: ${error.message}`);
    }
  }
  
  async removeProdToCart(cartId, prodId) {
    try {
      return await CartModel.findByIdAndUpdate(
        { _id: cartId },
        { $pull: { products: { product: prodId } } },
        { new: true }
      )
    } catch (error) {
      console.log(error);
    }
  }

  async update(id, obj) {
    try {
      const response = await CartModel.findByIdAndUpdate(id, obj, {
        new: true,
      });
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateProdQuantityToCart(cartId, prodId, quantity) {
    try {
      return await CartModel.findOneAndUpdate(
        { _id: cartId, 'products.product': prodId },
        { $set: { 'products.$.quantity': quantity } },
        { new: true }
      );
    } catch (error) {
      console.log(error);
    }
  }

  async clearCart(cartId) {
    try {
      return await CartModel.findOneAndUpdate(
        { _id: cartId },
        { $set: { products: [] } },
        { new: true }
      )
    } catch (error) {
      console.log(error);
    }
  }

  async purchaseCart(cartId) {
    const cart = await CartModel.findById(cartId).populate("products.product");
    for (const item of cart.products) {
      await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

}
