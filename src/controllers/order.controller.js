import * as orderService from "../services/order.services.js"
import * as userService from "../services/user.services.js"
import ExcelJS from "exceljs"

/**
 * Crea una nueva orden a partir del carrito del usuario
 */
export const createOrder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const user = await userService.getById(req.user.id)

    if (!user || !user.cart) {
      return res.status(404).json({ error: "Usuario o carrito no encontrado" })
    }

    // Extraer información de envío del usuario o de la solicitud
    const shippingInfo = req.body.shippingInfo || {
      nombre: user.nombre,
      apellido: user.apellido,
      provincia: user.provincia,
      ciudad: user.ciudad,
      calle: user.calle,
      altura: user.altura,
      codigoPostal: user.codigoPostal,
      phone: user.phone,
    }

    // Validar información de envío
    const requiredFields = ["nombre", "apellido", "provincia", "ciudad", "calle", "altura", "codigoPostal", "phone"]
    const missingFields = requiredFields.filter((field) => !shippingInfo[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Información de envío incompleta",
        missingFields,
      })
    }

    // Obtener el método de pago de la solicitud
    const { paymentMethod } = req.body

    if (!paymentMethod || !["transferencia", "mercadopago"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Método de pago inválido o no especificado" })
    }

    // Crear la orden con el método de pago
    const newOrder = await orderService.createFromCart(user._id, user.cart, shippingInfo, paymentMethod)

    // Asegurarse de que la respuesta incluya todos los datos necesarios
    res.status(201).json(newOrder)
  } catch (error) {
    console.error("Error en createOrder:", error.message)
    res.status(400).json({ error: error.message })
  }
}

/**
 * Obtiene una orden por su ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const order = await orderService.getById(id)

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    // Verificar si el usuario es administrador o es el propietario de la orden
    // Nota: Comentamos esta validación temporalmente para debugging
    /*
    if (req.user.role !== "admin" && order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }
    */

    // Asegurarse de que la orden tenga todos los datos populados
    const populatedOrder = await orderService.getById(id)

    // Devolver la orden con todos sus datos
    res.status(200).json(populatedOrder)
  } catch (error) {
    console.error("Error en getOrderById:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene las órdenes de un usuario
 */
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params

    // Verificar si el usuario es administrador o es el propio usuario
    if (req.user.role !== "admin" && userId !== req.user.id) {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

    const orders = await orderService.getByUser(userId)
    res.status(200).json(orders)
  } catch (error) {
    console.error("Error en getUserOrders:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene todas las órdenes (solo para administradores)
 */
export const getAllOrders = async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

    const orders = await orderService.getAll()
    res.status(200).json(orders)
  } catch (error) {
    console.error("Error en getAllOrders:", error.message)
    res.status(500).json({ error: error.message })
  }
}

// Asegurarse de que el controlador maneje correctamente los parámetros
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, trackingNumber, shippingCompany } = req.body

    console.log("Updating order:", id, "with status:", status, "tracking:", trackingNumber, "company:", shippingCompany)

    // Update the order status with tracking information
    const updatedOrder = await orderService.updateStatus(id, status, trackingNumber, shippingCompany)

    if (!updatedOrder) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    res.status(200).json({ success: true, orderStatus: updatedOrder.orderStatus })
  } catch (error) {
    console.error("Error en updateOrderStatus:", error.message)
    res.status(400).json({ error: error.message })
  }
}

/**
 * Genera una factura en formato Excel para una orden
 */
export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params
    const order = await orderService.getById(id)

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    // Verificar si el usuario es administrador o es el propietario de la orden
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

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

    // Formatear el número de orden con ceros a la izquierda (4 dígitos)
    const formattedOrderNumber = `#${order.orderNumber.toString().padStart(4, "0")}`

    const orderDataRow = worksheet.addRow([
      formattedOrderNumber,
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

    // Información de método de pago
    const paymentMethodRow = worksheet.addRow(["Método de Pago:", order.paymentMethod || "No especificado", "", "", ""])
    paymentMethodRow.getCell(1).font = { bold: true }
    paymentMethodRow.getCell(1).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    paymentMethodRow.getCell(2).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    // Información de empresa de envío
    const shippingCompanyRow = worksheet.addRow([
      "Empresa de Envío:",
      order.shippingInfo?.shippingCompany || "N/A",
      "",
      "",
      "",
    ])
    shippingCompanyRow.getCell(1).font = { bold: true }
    shippingCompanyRow.getCell(1).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    shippingCompanyRow.getCell(2).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    // Información de número de seguimiento
    const trackingNumberRow = worksheet.addRow([
      "Número de Seguimiento:",
      order.shippingInfo?.trackingNumber || "N/A",
      "",
      "",
      "",
    ])
    trackingNumberRow.getCell(1).font = { bold: true }
    trackingNumberRow.getCell(1).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    trackingNumberRow.getCell(2).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    // Espacio entre secciones
    worksheet.addRow([])

    // Título de la sección de productos
    worksheet.mergeCells("A16:H16")
    const productHeaderCell = worksheet.getCell("A16")
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
    res.setHeader("Content-Disposition", `attachment; filename=Factura-${formattedOrderNumber}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error generando factura:", error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Exporta todas las órdenes a un archivo Excel
 */
export const exportAllOrders = async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

    const orders = await orderService.getAll()

    // Crear workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Órdenes")

    // Estilos
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

    const sectionHeaderStyle = {
      font: { bold: true, size: 12 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEEFF" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "left", vertical: "middle" },
    }

    const dataStyle = {
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
    }

    // Modificar el estilo de separatorStyle para quitar el color azul
    const separatorStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } }, // Cambiado a gris claro
    }

    const orderIdStyle = {
      font: { bold: true, size: 14, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }

    // Título del reporte
    worksheet.mergeCells("A1:O1")
    const titleCell = worksheet.getCell("A1")
    titleCell.value = "REPORTE COMPLETO DE ÓRDENES"
    titleCell.style = {
      font: { bold: true, size: 16, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      alignment: { horizontal: "center", vertical: "middle" },
    }
    worksheet.getRow(1).height = 30

    // Información del reporte - Fecha de generación
    worksheet.mergeCells("A2:O2")
    const infoCell = worksheet.getCell("A2")
    infoCell.value = `Generado el: ${formatDateTo24Hour(new Date())}`
    infoCell.style = {
      font: { italic: true },
      alignment: { horizontal: "right" },
    }

    // Espacio
    worksheet.addRow([])

    // Cabeceras de columnas para órdenes
    const orderHeaders = [
      "Nº Orden",
      "Fecha",
      "Estado Actual",
      "Método de Pago",
      "Total",
      "Cliente",
      "Email",
      "Teléfono",
      "Dirección",
      "Ciudad",
      "Provincia",
      "CP",
      "Empresa de Envío",
      "Número de Seguimiento",
      "Productos",
    ]

    // Cabeceras de productos
    const productHeaders = [
      "Item",
      "Marca",
      "Modelo",
      "Categoría",
      "Medida",
      "Color",
      "Precio Unitario",
      "Cantidad",
      "Subtotal",
    ]

    let rowIndex = 4 // Comenzamos después del título y la fecha

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]

      // Formatear el número de orden con ceros a la izquierda (4 dígitos)
      const formattedOrderNumber = `#${order.orderNumber.toString().padStart(4, "0")}`

      // ID de la orden destacado
      worksheet.mergeCells(`A${rowIndex}:O${rowIndex}`)
      const orderIdCell = worksheet.getCell(`A${rowIndex}`)
      orderIdCell.value = `ORDEN: ${formattedOrderNumber}`
      orderIdCell.style = orderIdStyle
      worksheet.getRow(rowIndex).height = 25
      rowIndex++

      // Cabeceras de la orden
      const headerRow = worksheet.addRow(orderHeaders)
      headerRow.eachCell((cell, colNumber) => {
        cell.style = subHeaderStyle
      })
      rowIndex++

      const currentStatus = order.orderStatus.slice(-1)[0].status || "Pendiente"
      const orderDate = new Date(order.createdAt)
      const formattedDate = formatDateTo24Hour(orderDate)

      // Dirección completa
      const direccion = `${order.shippingInfo?.calle || ""} ${order.shippingInfo?.altura || ""}`

      // Fila principal de la orden
      const orderRow = worksheet.addRow([
        formattedOrderNumber,
        formattedDate,
        currentStatus,
        order.paymentMethod || "No especificado",
        order.totalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
        `${order.user?.nombre || ""} ${order.user?.apellido || ""}`,
        order.user?.email || "N/A",
        order.shippingInfo?.phone || "N/A",
        direccion,
        order.shippingInfo?.ciudad || "N/A",
        order.shippingInfo?.provincia || "N/A",
        order.shippingInfo?.codigoPostal || "N/A",
        order.shippingInfo?.shippingCompany || "N/A",
        order.shippingInfo?.trackingNumber || "N/A",
        order.products.length,
      ])

      orderRow.eachCell((cell) => {
        cell.style = dataStyle
      })
      rowIndex++

      // Espacio después de la información de la orden
      worksheet.addRow([])
      rowIndex++

      // Título simplificado de "Productos"
      worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`)
      const productsHeaderCell = worksheet.getCell(`A${rowIndex}`)
      productsHeaderCell.value = "PRODUCTOS"
      productsHeaderCell.style = {
        font: { bold: true, size: 12 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEEFF" } },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
        alignment: { horizontal: "center", vertical: "middle" }, // Cambiado a centrado
      }
      rowIndex++

      // Cabeceras de productos
      const productHeaderRow = worksheet.addRow(productHeaders) // Usar todas las columnas de productos
      productHeaderRow.eachCell((cell) => {
        cell.style = subHeaderStyle
      })
      rowIndex++

      // Detalles de cada producto
      order.products.forEach((item, index) => {
        const productRow = worksheet.addRow([
          index + 1,
          item.product?.marca || "N/A",
          item.product?.modelo || "N/A",
          item.product?.categoria || "N/A",
          item.product?.medida || "N/A",
          item.product?.color || "N/A",
          item.priceAtPurchase.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
          item.quantity,
          (item.priceAtPurchase * item.quantity).toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
        ])

        productRow.eachCell((cell) => {
          cell.style = dataStyle
        })
        rowIndex++
      })

      // Subtotal de la orden
      const subtotalRow = worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "SUBTOTAL:",
        "",
        order.totalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
      ])

      subtotalRow.getCell(7).font = { bold: true }
      subtotalRow.getCell(9).font = { bold: true }
      rowIndex++

      // Añadir una separación visual clara entre órdenes (excepto para la última)
      if (i < orders.length - 1) {
        // Añadir espacio
        worksheet.addRow([])
        rowIndex++

        // Añadir una línea separadora más ancha con el color azul del título
        const separatorRow = worksheet.addRow(Array(15).fill(""))
        separatorRow.eachCell((cell) => {
          cell.style = separatorStyle
        })
        separatorRow.height = 15 // Altura aumentada para una separación más visible
        rowIndex++

        worksheet.addRow([])
        rowIndex++
      }
    }

    // Ajustar anchos de columna
    worksheet.getColumn(1).width = 15 // Nº Orden
    worksheet.getColumn(2).width = 20 // Fecha
    worksheet.getColumn(3).width = 15 // Estado Actual
    worksheet.getColumn(4).width = 15 // Método de Pago
    worksheet.getColumn(5).width = 15 // Total
    worksheet.getColumn(6).width = 20 // Cliente
    worksheet.getColumn(7).width = 25 // Email
    worksheet.getColumn(8).width = 15 // Teléfono
    worksheet.getColumn(9).width = 25 // Dirección
    worksheet.getColumn(10).width = 15 // Ciudad
    worksheet.getColumn(11).width = 15 // Provincia
    worksheet.getColumn(12).width = 10 // CP
    worksheet.getColumn(13).width = 15 // Empresa de Envío
    worksheet.getColumn(14).width = 20 // Número de Seguimiento
    worksheet.getColumn(15).width = 10 // Productos

    // Configurar respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=Reporte_Completo_Ordenes.xlsx")

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error exportando órdenes:", error)
    res.status(500).json({ error: error.message })
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
