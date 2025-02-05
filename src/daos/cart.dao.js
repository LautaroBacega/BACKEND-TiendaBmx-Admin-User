import { CartModel } from "./models/cart.model.js";

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
        const existProdInCart = await this.existProdInCart(cartId, prodId);
        if (existProdInCart) {
          // Si el producto ya existe, aumentar la cantidad
          return await CartModel.findOneAndUpdate(
            { _id: cartId, 'products.product': prodId },
            { $set: { 'products.$.quantity': existProdInCart.products[0].quantity + 1 } },
            { new: true }
          );
        } else {
          // Si el producto no existe, agregarlo
          return await CartModel.findByIdAndUpdate(
            cartId,
            { $push: { products: { product: prodId, quantity: 1 } } },
            { new: true }
          );
        }
      } catch (error) {
        console.log(error);
        throw new Error("Error al agregar producto al carrito");
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
}
