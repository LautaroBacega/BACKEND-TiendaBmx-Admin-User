import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

/**
 * Genera un PDF de factura con diseño mejorado
 * @param {Object} order - Datos completos de la orden
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
export const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const buffers = []
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      })

      // Capturar el PDF en un buffer
      doc.on("data", buffers.push.bind(buffers))
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })

      // Formatear el número de orden
      const formattedOrderNumber = `#${order.orderNumber.toString().padStart(4, "0")}`

      // Colores
      const primaryColor = "#ff4141"
      const secondaryColor = "#333333"
      const lightGray = "#f5f5f5"

      // Encabezado
      doc.rect(0, 0, doc.page.width, 150).fill(primaryColor)

      // Logo o nombre de la tienda
      doc.font("Helvetica-Bold").fontSize(28).fillColor("#ffffff").text("ACCESORIOS BMX", 50, 50)

      // Información de la factura
      doc
        .fontSize(14)
        .text("FACTURA DE COMPRA", 50, 85)
        .fontSize(12)
        .text(`Número: ${formattedOrderNumber}`, 50, 105)
        .text(`Fecha: ${new Date(order.createdAt).toLocaleDateString("es-AR")}`, 50, 125)

      // Información de la empresa (lado derecho)
      const companyInfoX = 350
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#ffffff")
        .text("Accesorios Bmx", companyInfoX, 50)
        .text("CUIT: 30-12345678-9", companyInfoX, 65)
        .text("Bahia Blanca, Buenos Aires", companyInfoX, 80)
        .text("accesoriosbmx@gmail.com", companyInfoX, 95)
        .text("(011) 4567-8900", companyInfoX, 110)

      // Información del cliente
      const startY = 180
      doc.font("Helvetica-Bold").fontSize(14).fillColor(secondaryColor).text("DATOS DEL CLIENTE", 50, startY)

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(secondaryColor)
        .text(`Nombre: ${order.user.nombre} ${order.user.apellido}`, 50, startY + 25)
        .text(`Email: ${order.user.email}`, 50, startY + 40)
        .text(`Teléfono: ${order.shippingInfo.phone || "No especificado"}`, 50, startY + 55)

      // Dirección de envío
      doc.font("Helvetica-Bold").fontSize(14).text("DIRECCIÓN DE ENVÍO", 300, startY)

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`${order.shippingInfo.calle} ${order.shippingInfo.altura}`, 300, startY + 25)
        .text(`${order.shippingInfo.ciudad}, ${order.shippingInfo.provincia}`, 300, startY + 40)
        .text(`CP: ${order.shippingInfo.codigoPostal}`, 300, startY + 55)

      // Método de pago
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("MÉTODO DE PAGO", 50, startY + 85)

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(order.paymentMethod.toUpperCase(), 50, startY + 105)

      // Información de envío
      if (order.shippingInfo.trackingNumber || order.shippingInfo.shippingCompany) {
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("INFORMACIÓN DE ENVÍO", 300, startY + 85)

        doc.font("Helvetica").fontSize(10)

        if (order.shippingInfo.shippingCompany) {
          doc.text(`Empresa: ${order.shippingInfo.shippingCompany}`, 300, startY + 105)
        }

        if (order.shippingInfo.trackingNumber) {
          doc.text(`Tracking: ${order.shippingInfo.trackingNumber}`, 300, startY + 120)
        }
      }

      // Tabla de productos
      const tableTop = startY + 150
      const tableHeaders = ["Producto", "Cantidad", "Precio Unit.", "Subtotal"]
      const tableColumnWidths = [250, 70, 100, 80]

      // Encabezado de la tabla
      doc.rect(50, tableTop, 500, 25).fill(primaryColor)

      doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff")

      let currentX = 60
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, tableTop + 8)
        currentX += tableColumnWidths[i]
      })

      // Filas de productos
      let currentY = tableTop + 25

      order.products.forEach((item, index) => {
        // Alternar colores de fondo para las filas
        if (index % 2 === 0) {
          doc.rect(50, currentY, 500, 25).fill(lightGray)
        }

        doc.font("Helvetica").fontSize(9).fillColor(secondaryColor)

        // Producto
        doc.text(`${item.product.marca} ${item.product.modelo}`, 60, currentY + 8, { width: 240, ellipsis: true })

        // Cantidad
        doc.text(item.quantity.toString(), 310, currentY + 8, { width: 70 })

        // Precio unitario
        doc.text(`$${item.priceAtPurchase.toFixed(2)}`, 380, currentY + 8, { width: 100 })

        // Subtotal
        doc.text(`$${(item.priceAtPurchase * item.quantity).toFixed(2)}`, 480, currentY + 8, { width: 80 })

        currentY += 25
      })

      // Línea separadora
      doc
        .strokeColor(primaryColor)
        .lineWidth(1)
        .moveTo(50, currentY + 10)
        .lineTo(550, currentY + 10)
        .stroke()

      // Total
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(secondaryColor)
        .text("TOTAL:", 400, currentY + 30)

      doc
        .fontSize(14)
        .fillColor(primaryColor)
        .text(`$${order.totalAmount.toFixed(2)}`, 480, currentY + 30)

      // Pie de página
      const footerY = doc.page.height - 100

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#999999")
        .text("Este documento es una constancia de compra y no tiene validez fiscal.", 50, footerY - 20, {
          align: "center",
          width: 500,
        })

      doc.text("© 2025 Accesorios Bmx - Todos los derechos reservados", 50, footerY, {
        align: "center",
        width: 500,
      })

      doc.end()
    } catch (error) {
      console.error("Error generando PDF:", error)
      reject(error)
    }
  })
}

/**
 * Guarda el PDF generado en el sistema de archivos (para pruebas)
 * @param {Buffer} pdfBuffer - Buffer del PDF generado
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<string>} - Ruta del archivo guardado
 */
export const savePDFToFile = async (pdfBuffer, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(process.cwd(), "temp", filename)

      // Asegurarse de que el directorio exista
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFile(filePath, pdfBuffer, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(filePath)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}
