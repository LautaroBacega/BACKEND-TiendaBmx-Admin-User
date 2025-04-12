import { OrderModel } from "../daos/models/order.model.js";
import { ProductModel } from "../daos/models/product.model.js";
import { userModel } from "../daos/models/user.model.js";
import mongoose from "mongoose";
import ExcelJS from 'exceljs';

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

export const generateInvoice = async (req, res) => {
  try {
      const order = await OrderModel.findById(req.params.id)
          .populate('user', 'nombre apellido email')
          .populate('products.product', 'marca modelo categoria medida color precioOferta precioBase');

      if (!order) return res.status(404).json({ error: "Orden no encontrada" });

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Factura');

      // Estilos
      const headerStyle = {
          font: { bold: true, color: { argb: 'FFFFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } },
          border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      };

      // Cabeceras
      worksheet.columns = [
          { header: 'Item', key: 'item', width: 10 },
          { header: 'Producto', key: 'producto', width: 30 },
          { header: 'Cantidad', key: 'cantidad', width: 15 },
          { header: 'Precio Unitario', key: 'precio', width: 20 },
          { header: 'Subtotal', key: 'subtotal', width: 20 }
      ];

      worksheet.getRow(1).eachCell(cell => {
          cell.style = headerStyle;
      });

      // Detalle de productos
      order.products.forEach((item, index) => {
          worksheet.addRow({
              item: index + 1,
              producto: `${item.product.marca} ${item.product.modelo}`,
              cantidad: item.quantity,
              precio: item.priceAtPurchase.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
              subtotal: (item.priceAtPurchase * item.quantity).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
          });
      });

      // Totales
      worksheet.addRow([]);
      worksheet.addRow({
          producto: 'TOTAL',
          subtotal: order.totalAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
      }).eachCell(cell => cell.font = { bold: true });

      // Configurar respuesta
      res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
          'Content-Disposition',
          `attachment; filename=Factura-${order._id}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();

  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

export const exportAllOrders = async (req, res) => {
  try {
      const orders = await OrderModel.find()
          .populate('user', 'nombre apellido email')
          .populate('products.product', 'marca modelo');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Órdenes');

      // Estilos para cabeceras
      worksheet.columns = [
          { header: 'ID Orden', key: '_id', width: 25 },
          { header: 'Cliente', key: 'cliente', width: 30 },
          { header: 'Fecha', key: 'fecha', width: 20 },
          { header: 'Total', key: 'total', width: 15 },
          { header: 'Estado Actual', key: 'estado', width: 20 },
          { header: 'Productos', key: 'productos', width: 40 }
      ];

      // Llenar datos
      orders.forEach(order => {
          worksheet.addRow({
              _id: order._id,
              cliente: `${order.user?.nombre} ${order.user?.apellido}`,
              fecha: order.createdAt.toISOString().split('T')[0],
              total: order.totalAmount,
              estado: order.orderStatus.slice(-1)[0].status,
              productos: order.products.map(p => 
                  `${p.quantity}x ${p.product?.marca} ${p.product?.modelo}`
              ).join('\n')
          });
      });

      // Configurar respuesta
      res.setHeader('Content-Type', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 
          'attachment; filename=Todas_las_ordenes.xlsx');

      await workbook.xlsx.write(res);
      res.end();

  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};