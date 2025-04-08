import { OrderModel } from "../daos/models/order.model.js";
import { ProductModel } from "../daos/models/product.model.js";
import { userModel } from "../daos/models/user.model.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  console.log("Iniciando creación de orden");
  try {
    const user = await userModel.findById(req.user.id)
      .populate('cart')
      .session(session);

    // 1. Validar stock y preparar productos
    const productsWithStock = await Promise.all(
      user.cart.products.map(async (item) => {
        const product = await ProductModel.findById(item.product).session(session);
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.modelo}`);
        }
        return {
          product: item.product,
          quantity: item.quantity,
          priceAtPurchase: item.price
        };
      })
    );

    // 2. Crear la orden
    const order = new OrderModel({
      user: user._id,
      products: productsWithStock,
      shippingInfo: {
        nombre: user.nombre,
        apellido: user.apellido,
        provincia: user.provincia,
        ciudad: user.ciudad,
        calle: user.calle,
        altura: user.altura,
        codigoPostal: user.codigoPostal,
        phone: user.phone
      },
      totalAmount: productsWithStock.reduce((total, item) => total + (item.priceAtPurchase * item.quantity), 0),
      orderStatus: [{ status: "creado" }]
    });

    // 3. Actualizar stock y vaciar carrito
    const bulkOps = productsWithStock.map(item => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } }
      }
    }));

    await ProductModel.bulkWrite(bulkOps, { session });
    await order.save({ session });
    
    user.cart.products = [];
    user.orders.push(order._id);
    await user.save({ session });

    console.log("Orden creada:", order); 
    await session.commitTransaction();
    console.log("Transacción completada");
    res.status(201).json(order);

  } catch (error) {
    console.error("Error en creación de orden:", error);
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .populate('products.product')
      .populate('user', 'email nombre apellido');
    
    if (!order) return res.status(404).json({ error: "Orden no encontrada" });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
    try {
      const orders = await OrderModel.find({ user: req.params.userId })
        .populate('products.product')
        .sort({ createdAt: -1 })
  
      res.json(orders)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
}

export const getAllOrders = async (req, res) => {
    try {
      // Verificar rol de administrador
      if(req.user.role !== "admin") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
  
      const orders = await OrderModel.find()
        .populate('user', 'nombre apellido email')
        .populate('products.product')
        .sort({ createdAt: -1 });
  
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validar estado
        const validStatus = [
            "creado", 
            "pago aprobado", 
            "preparando paquete", 
            "enviado", 
            "entregado", 
            "cancelado"
        ];
        
        if (!validStatus.includes(status)) {
            return res.status(400).json({ error: "Estado inválido" });
        }

        // Actualizar orden (CORRECCIÓN APLICADA)
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            id,
            { 
                $push: { 
                    orderStatus: { 
                        status: status, // <-- Sintaxis explícita
                        timestamp: new Date() 
                    } 
                } 
            }, // <-- ¡Esta coma es crucial!
            { 
                new: true, 
                session 
            }
        ).populate('user', 'nombre email');

        if (!updatedOrder) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        await session.commitTransaction();
        res.json(updatedOrder);

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
};