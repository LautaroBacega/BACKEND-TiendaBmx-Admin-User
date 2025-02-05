import ProductDaoMongoDB from "../daos/mongodb/product.dao.js";
const prodDao = new ProductDaoMongoDB();

import CartDaoMongoDB from "../daos/mongodb/cart.dao.js";
import { CartModel } from "../daos/mongodb/models/cart.model.js";
const cartDao = new CartDaoMongoDB();
const productDao = new ProductDaoMongoDB();

import { createTicket } from '../daos/mongodb/ticket.dao.js';
import { v4 as uuidv4 } from 'uuid';

export const getAll = async () => {
  try {
    return await cartDao.getAll();
  } catch (error) {
    console.log(error);
  }
};

export const getById = async (id) => {
  try {
    return await cartDao.getById(id);
  } catch (error) {
    console.log(error);
  }
};

export const create = async () => {
  try {
    const newcart = await cartDao.create();
    if (!newcart) return false;
    else return newcart;
  } catch (error) {
    console.log(error);
  }
};

export const update = async (id, obj) => {
  try {
    return await cartDao.update(id, obj);
  } catch (error) {
    console.log(error);
  }
};

export const remove = async (id) => {
  try {
    const cartDel = await cartDao.delete(id);
    if (!cartDel) return false;
    else return cartDel;
  } catch (error) {
    console.log(error);
  }
};

export const addProdToCart = async (cartId, prodId) => {
  try {
    const existCart = await getById(cartId);
    if (!existCart) return null;

    const existProd = await prodDao.getById(prodId);
    if (!existProd) return null;

    return await cartDao.addProdToCart(cartId, prodId);
  } catch (error) {
    console.log(error);
  }
};

export const removeProdToCart = async (cartId, prodId) => {
  try {
    const existCart = await getById(cartId);
    if (!existCart) return null;
    const existProdInCart = await cartDao.existProdInCart(cartId, prodId);
    if (!existProdInCart) return null;
    return await cartDao.removeProdToCart(cartId, prodId);
  } catch (error) {
    console.log(error);
  }
};

export const updateProdQuantityToCart = async (cartId, prodId, quantity) => {
  try {
    const existCart = await getById(cartId);
    if (!existCart) return null;

    const existProdInCart = await cartDao.existProdInCart(cartId, prodId);
    if (!existProdInCart) return null;
    
    return await cartDao.updateProdQuantityToCart(cartId, prodId, quantity);
  } catch (error) {
    console.log(error);
  }
};

export const clearCart = async (cartId) => {
  try {
    const existCart = await getById(cartId);
    if (!existCart) return null;
    return await cartDao.clearCart(cartId)
  } catch (error) {
    console.log(error);
  }
};

export const finalizarCompra = async (cartId, user) => {
  try {
    if (!user || !user._id) {
      throw new Error('Usuario no válido o no autenticado');
    }

    const cart = await CartModel.findById(cartId).populate("products.product");

    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    const productosNoComprados = [];

    for (let item of cart.products) {
      const { product, quantity } = item;

      if (!product || !product._id) {
        throw new Error(`Producto no encontrado en el carrito`);
      }

      if (product.stock == null || isNaN(product.stock)) {
        throw new Error(`El producto ${product.name || 'desconocido'} tiene un valor de stock inválido`);
      }

      if (product.stock < quantity) {
        productosNoComprados.push(item);
        continue;
      }

      const newStock = product.stock - quantity;
      await productDao.update(product._id, { stock: newStock });
    }

    // Crear ticket de compra
    const ticket = await createTicket({
      code: uuidv4(),
      purchase_datetime: new Date(),
      amount: cart.products.reduce(
        (acc, curr) => acc + curr.quantity * curr.product.price,
        0
      ),
      purchaser: user._id,
    });

    // Actualizar el carrito con solo los productos no comprados
    cart.products = productosNoComprados;
    await cart.save();

    return ticket;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
