import CartDaoMongoDB from "../daos/cart.dao.js";
import { ProductModel } from "../daos/models/product.model.js"; // Asegúrate de tener el modelo de productos

const cartDao = new CartDaoMongoDB();

// Agregar producto al carrito - solo accesible con un token válido
export const addToCart = async (req, res) => {
  const user = req.user; // Usuario autenticado
  const { productId } = req.body; // ID del producto a agregar al carrito

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    // Verificar si el producto existe
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verificar si el usuario tiene un carrito asociado
    let cart = user.cart[0]; // Obtener el primer carrito del usuario
    if (!cart) {
      // Si el usuario no tiene un carrito, crear uno nuevo
      cart = await cartDao.create();
      user.cart.push(cart._id); // Asignar el nuevo carrito al usuario
      await user.save();
    }

    // Agregar el producto al carrito (o actualizar la cantidad si ya está en el carrito)
    const updatedCart = await cartDao.addProdToCart(cart._id, productId);
    res.status(200).json({ message: "Product added to cart", cart: updatedCart });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding product to cart" });
  }
};

// Crear un carrito
export const createCart = async (req, res) => {
  try {
    const newCart = await cartDao.create();
    if (!newCart) {
      return res.status(500).json({ message: "Error al crear el carrito" });
    }
    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los carritos
export const getAllCarts = async (req, res) => {
  try {
    const carts = await cartDao.getAll();
    res.status(200).json(carts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un carrito específico por ID
export const getCartById = async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await cartDao.getById(id);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar producto del carrito
export const removeProductFromCart = async (req, res) => {
  const { id: cartId, prodId } = req.params;
  try {
    const updatedCart = await cartDao.removeProdToCart(cartId, prodId);
    if (!updatedCart) {
      return res.status(404).json({ message: "Carrito o producto no encontrado" });
    }
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};