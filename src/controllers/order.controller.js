import { OrderModel } from "../daos/models/order.model.js"
import { ProductModel } from "../daos/models/product.model.js"
import { userModel } from "../daos/models/user.model.js"
import mongoose from "mongoose"
import ExcelJS from "exceljs"

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  console.log("Iniciando creación de orden")
  try {
    const user = await userModel.findById(req.user.id).populate("cart").session(session)

    // 1. Validar stock y preparar productos
    const productsWithStock = await Promise.all(
      user.cart.products.map(async (item) => {
        const product = await ProductModel.findById(item.product).session(session)
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.modelo}`)
        }
        return {
          product: item.product,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        }
      }),
    )

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
        phone: user.phone,
      },
      totalAmount: productsWithStock.reduce((total, item) => total + item.priceAtPurchase * item.quantity, 0),
      orderStatus: [{ status: "creado" }],
    })

    // 3. Actualizar stock y vaciar carrito
    const bulkOps = productsWithStock.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } },
      },
    }))

    await ProductModel.bulkWrite(bulkOps, { session })
    await order.save({ session })

    user.cart.products = []
    user.orders.push(order._id)
    await user.save({ session })

    console.log("Orden creada:", order)
    await session.commitTransaction()
    console.log("Transacción completada")
    res.status(201).json(order)
  } catch (error) {
    console.error("Error en creación de orden:", error)
    await session.abortTransaction()
    res.status(400).json({ error: error.message })
  } finally {
    session.endSession()
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .populate("products.product")
      .populate("user", "email nombre apellido")

    if (!order) return res.status(404).json({ error: "Orden no encontrada" })

    res.json(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getUserOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({ user: req.params.userId })
      .populate("products.product")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAllOrders = async (req, res) => {
  try {
    // Verificar rol de administrador
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

    const orders = await OrderModel.find()
      .populate("user", "nombre apellido email")
      .populate("products.product")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { id } = req.params
    const { status } = req.body

    // Validar estado
    const validStatus = ["creado", "pago aprobado", "preparando paquete", "enviado", "entregado", "cancelado"]

    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" })
    }

    // Actualizar orden (CORRECCIÓN APLICADA)
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      {
        $push: {
          orderStatus: {
            status: status, // <-- Sintaxis explícita
            timestamp: new Date(),
          },
        },
      }, // <-- ¡Esta coma es crucial!
      {
        new: true,
        session,
      },
    ).populate("user", "nombre email")

    if (!updatedOrder) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    await session.commitTransaction()
    res.json(updatedOrder)
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ error: error.message })
  } finally {
    session.endSession()
  }
}

// Función auxiliar para formatear fechas en formato de 24 horas
const formatDateTo24Hour = (date) => {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Esto fuerza el formato de 24 horas
  })
}

export const generateInvoice = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .populate("user", "nombre apellido email")
      .populate("products.product", "marca modelo categoria medida color precioOferta precioBase")

    if (!order) return res.status(404).json({ error: "Orden no encontrada" })

    // Crear workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Factura")

    // Configuración de estilos
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }

    const subHeaderStyle = {
      font: { bold: true },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6E6E6" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }

    const dataStyle = {
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
    }

    const sectionHeaderStyle = {
      font: { bold: true, size: 12 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEEFF" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "left", vertical: "middle" },
    }

    // Título del reporte
    worksheet.mergeCells("A1:H1")
    const titleCell = worksheet.getCell("A1")
    titleCell.value = "FACTURA DE ORDEN"
    titleCell.style = {
      font: { bold: true, size: 16, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }
    worksheet.getRow(1).height = 30

    // Información del reporte - Fecha de generación
    worksheet.mergeCells("A2:H2")
    const infoCell = worksheet.getCell("A2")
    infoCell.value = `Generado el: ${formatDateTo24Hour(new Date())}`
    infoCell.style = {
      font: { italic: true },
      alignment: { horizontal: "right" },
    }

    // Información del cliente
    worksheet.mergeCells("A4:E4")
    const clienteHeaderCell = worksheet.getCell("A4")
    clienteHeaderCell.value = "INFORMACIÓN DE LA ORDEN"
    clienteHeaderCell.style = headerStyle
    clienteHeaderCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 }

    // Primera fila con información de la orden
    worksheet.addRow(["ID Orden", "Fecha y Hora de Creación", "Estado Actual", "Cliente", "Total"]).eachCell((cell) => {
      cell.style = subHeaderStyle
    })

    // Datos de la orden
    const currentStatus = order.orderStatus.slice(-1)[0].status || "Pendiente"
    const orderDate = new Date(order.createdAt)
    const formattedDate = formatDateTo24Hour(orderDate)

    const orderDataRow = worksheet.addRow([
      order._id.toString(),
      formattedDate,
      currentStatus,
      `${order.user?.nombre || ""} ${order.user?.apellido || ""}`,
      order.totalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
    ])
    orderDataRow.eachCell((cell) => {
      cell.style = dataStyle
    })

    // Espacio entre secciones
    worksheet.addRow([])

    // Información de envío
    worksheet.mergeCells("A8:E8")
    const shippingHeaderCell = worksheet.getCell("A8")
    shippingHeaderCell.value = "INFORMACIÓN DE ENVÍO"
    shippingHeaderCell.style = sectionHeaderStyle

    // Datos de envío
    const shippingInfoRow1 = worksheet.addRow([
      "Dirección:",
      `${order.shippingInfo?.calle || ""} ${order.shippingInfo?.altura || ""}, ${
        order.shippingInfo?.ciudad || ""
      }, ${order.shippingInfo?.provincia || ""}`,
      "",
      "",
      "",
    ])
    shippingInfoRow1.getCell(1).font = { bold: true }
    shippingInfoRow1.getCell(1).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    shippingInfoRow1.getCell(2).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    const shippingInfoRow2 = worksheet.addRow(["Teléfono:", order.shippingInfo?.phone || "N/A", "", "", ""])
    shippingInfoRow2.getCell(1).font = { bold: true }
    shippingInfoRow2.getCell(1).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    shippingInfoRow2.getCell(2).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    const shippingInfoRow3 = worksheet.addRow(["Email:", order.user?.email || "N/A", "", "", ""])
    shippingInfoRow3.getCell(1).font = { bold: true }
    shippingInfoRow3.getCell(1).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    shippingInfoRow3.getCell(2).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    // Espacio entre secciones
    worksheet.addRow([])

    // Título de la sección de productos
    worksheet.mergeCells("A13:H13")
    const productHeaderCell = worksheet.getCell("A13")
    productHeaderCell.value = "DETALLE DE PRODUCTOS"
    productHeaderCell.style = headerStyle
    productHeaderCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 }

    // Cabeceras de productos
    const productHeadersRow = worksheet.addRow([
      "Item",
      "Producto",
      "Categoría",
      "Medida",
      "Color",
      "Cantidad",
      "Precio Unitario",
      "Subtotal",
    ])
    productHeadersRow.eachCell((cell) => {
      cell.style = subHeaderStyle
    })

    // Detalle de productos
    order.products.forEach((item, index) => {
      const productRow = worksheet.addRow([
        index + 1,
        `${item.product.marca} ${item.product.modelo}`,
        item.product.categoria || "N/A",
        item.product.medida || "N/A",
        item.product.color || "N/A",
        item.quantity,
        item.priceAtPurchase.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
        (item.priceAtPurchase * item.quantity).toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
        }),
      ])
      productRow.eachCell((cell) => {
        cell.style = dataStyle
      })
    })

    // Totales
    worksheet.addRow([])
    const totalRow = worksheet.addRow([
      "",
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      order.totalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
    ])
    totalRow.getCell(2).font = { bold: true }
    totalRow.getCell(8).font = { bold: true }
    totalRow.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEEEE" } }

    // Ajustar anchos de columna
    worksheet.getColumn(1).width = 8 // Item
    worksheet.getColumn(2).width = 30 // Producto
    worksheet.getColumn(3).width = 15 // Categoría
    worksheet.getColumn(4).width = 10 // Medida
    worksheet.getColumn(5).width = 15 // Color
    worksheet.getColumn(6).width = 10 // Cantidad
    worksheet.getColumn(7).width = 15 // Precio Unitario
    worksheet.getColumn(8).width = 15 // Subtotal

    // Configurar respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=Factura-${order._id}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error generando factura:", error)
    res.status(500).json({ error: error.message })
  }
}

export const exportAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("user", "nombre apellido email")
      .populate("products.product", "marca modelo categoria medida color precioBase precioOferta")
      .sort({ createdAt: -1 })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Órdenes")

    // Estilos
    const orderHeaderStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }

    const productHeaderStyle = {
      font: { bold: true },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6E6E6" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }

    const shippingHeaderStyle = {
      font: { bold: true },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEEFF" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "left", vertical: "middle" },
    }

    const dataStyle = {
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
    }

    // Título del reporte
    worksheet.mergeCells("A1:G1")
    const titleCell = worksheet.getCell("A1")
    titleCell.value = "REPORTE DE ÓRDENES"
    titleCell.style = {
      font: { bold: true, size: 16, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }
    worksheet.getRow(1).height = 30

    // Información del reporte
    worksheet.mergeCells("A2:G2")
    const infoCell = worksheet.getCell("A2")
    infoCell.value = `Generado el: ${formatDateTo24Hour(new Date())}`
    infoCell.style = {
      font: { italic: true },
      alignment: { horizontal: "right" },
    }

    let rowIndex = 3

    // Cabeceras de productos (se usarán después de cada orden)
    const productHeaders = ["Producto", "Categoría", "Medida", "Color", "Cantidad", "Precio Unitario", "Subtotal"]

    // Procesar cada orden
    for (const order of orders) {
      // Espacio antes de cada orden
      rowIndex++

      // Cabecera de la orden
      const headerRow = worksheet.addRow(["ID Orden", "Fecha y Hora", "Estado", "Cliente", "Total"])
      headerRow.eachCell((cell) => {
        cell.style = orderHeaderStyle
      })
      rowIndex++

      // Datos de la orden
      const currentStatus = order.orderStatus.slice(-1)[0].status || "Pendiente"
      const orderDate = new Date(order.createdAt)
      const formattedDate = formatDateTo24Hour(orderDate)

      const orderDataRow = worksheet.addRow([
        order._id.toString(),
        formattedDate,
        currentStatus,
        `${order.user?.nombre || ""} ${order.user?.apellido || ""}`,
        order.totalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
      ])
      orderDataRow.eachCell((cell) => {
        cell.style = dataStyle
      })
      rowIndex++

      // Información de envío
      const shippingHeaderRow = worksheet.addRow(["INFORMACIÓN DE ENVÍO", "", "", "", ""])
      shippingHeaderRow.getCell(1).style = shippingHeaderStyle
      rowIndex++

      // Datos de envío
      const addressRow = worksheet.addRow([
        `Dirección: ${order.shippingInfo?.calle || ""} ${order.shippingInfo?.altura || ""}, ${
          order.shippingInfo?.ciudad || ""
        }, ${order.shippingInfo?.provincia || ""}`,
        "",
        "",
        "",
        "",
      ])
      addressRow.getCell(1).style = dataStyle
      rowIndex++

      const phoneRow = worksheet.addRow([`Teléfono: ${order.shippingInfo?.phone || "N/A"}`, "", "", "", ""])
      phoneRow.getCell(1).style = dataStyle
      rowIndex++

      const emailRow = worksheet.addRow([`Email: ${order.user?.email || "N/A"}`, "", "", "", ""])
      emailRow.getCell(1).style = dataStyle
      rowIndex++

      // Cabeceras de productos
      const productHeaderRow = worksheet.addRow(productHeaders)
      productHeaderRow.eachCell((cell) => {
        cell.style = productHeaderStyle
      })
      rowIndex++

      // Detalle de productos
      for (const item of order.products) {
        const productRow = worksheet.addRow([
          `${item.product?.marca || ""} ${item.product?.modelo || ""}`,
          item.product?.categoria || "N/A",
          item.product?.medida || "N/A",
          item.product?.color || "N/A",
          item.quantity,
          item.priceAtPurchase?.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
          (item.priceAtPurchase * item.quantity)?.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
        ])
        productRow.eachCell((cell) => {
          cell.style = dataStyle
        })
        rowIndex++
      }

      // Línea de separación entre órdenes
      const separatorRow = worksheet.addRow([""])
      separatorRow.height = 20
      rowIndex++
    }

    // Ajustar anchos de columna
    worksheet.getColumn(1).width = 40 // Producto/ID Orden/Dirección
    worksheet.getColumn(2).width = 20 // Categoría/Fecha
    worksheet.getColumn(3).width = 15 // Medida/Estado
    worksheet.getColumn(4).width = 20 // Color/Cliente
    worksheet.getColumn(5).width = 10 // Cantidad/Total
    worksheet.getColumn(6).width = 15 // Precio Unitario
    worksheet.getColumn(7).width = 15 // Subtotal

    // Configurar respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=Todas_las_ordenes.xlsx")

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error exportando órdenes:", error)
    res.status(500).json({ error: error.message })
  }
}