import nodemailer from "nodemailer"
import PDFDocument from "pdfkit"

// Configuración del transporter de nodemailer
const createTransporter = () => {
  // Puedes usar diferentes servicios como Gmail, Outlook, etc.
  // Para producción, deberías usar variables de entorno para estas credenciales
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true" || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

/**
 * Genera un PDF de factura y lo devuelve como un buffer
 * @param {Object} order - Datos de la orden
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
export const generateOrderPDFBuffer = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const buffers = []
      const doc = new PDFDocument()
      const formattedOrderNumber = `#${order.orderNumber.toString().padStart(4, "0")}`

      // Capturar el PDF en un buffer
      doc.on("data", buffers.push.bind(buffers))
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })

      // Estilos base
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Factura de Compra", { align: "center", underline: true })
        .moveDown(0.5)

      // Información de la orden
      doc
        .font("Helvetica")
        .text(`Número de Orden: ${formattedOrderNumber}`)
        .text(
          `Fecha y Hora: ${new Date(order.createdAt).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}`,
        )
        .text(`Método de Pago: ${order.paymentMethod.toUpperCase()}`)
        .moveDown()

      // Información del cliente
      doc
        .font("Helvetica-Bold")
        .text("Datos del Cliente:")
        .font("Helvetica")
        .text(`Nombre: ${order.user.nombre} ${order.user.apellido}`)
        .text(`Email: ${order.user.email}`)
        .text(`Teléfono: ${order.shippingInfo.phone}`)
        .moveDown()

      // Dirección completa
      doc
        .font("Helvetica-Bold")
        .text("Dirección de Envío:")
        .font("Helvetica")
        .text(`${order.shippingInfo.calle} ${order.shippingInfo.altura}`)
        .text(`${order.shippingInfo.ciudad}, ${order.shippingInfo.provincia}`)
        .text(`CP: ${order.shippingInfo.codigoPostal}`)
        .moveDown()

      // Detalles de productos
      doc.font("Helvetica-Bold").text("Productos:").font("Helvetica")
      order.products.forEach((item, index) => {
        doc
          .text(`${index + 1}. ${item.product.marca} ${item.product.modelo}`)
          .text(`   Cantidad: ${item.quantity} - Precio: $${item.priceAtPurchase.toFixed(2)}`)
      })

      // Totales
      doc
        .moveDown()
        .font("Helvetica-Bold")
        .text(`Total: $${order.totalAmount.toFixed(2)}`, { align: "right" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Envía un correo electrónico con la factura PDF adjunta
 * @param {Object} order - Datos de la orden
 * @param {Buffer} pdfBuffer - Buffer del PDF a adjuntar
 * @returns {Promise<Object>} - Resultado del envío
 */
export const sendOrderConfirmationEmail = async (order, pdfBuffer) => {
  try {
    const transporter = createTransporter()
    const formattedOrderNumber = `#${order.orderNumber.toString().padStart(4, "0")}`

    // Crear el mensaje
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.user.email,
      subject: `Confirmación de Pedido ${formattedOrderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff4141; text-align: center;">¡Gracias por tu compra!</h2>
          <p>Hola ${order.user.nombre},</p>
          <p>Hemos recibido tu pedido correctamente. A continuación encontrarás los detalles:</p>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Número de Orden:</strong> ${formattedOrderNumber}</p>
            <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-AR")}</p>
            <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> ${order.paymentMethod.toUpperCase()}</p>
          </div>
          
          <p>Adjunto encontrarás la factura de tu compra en formato PDF.</p>
          
          <p>Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.</p>
          
          <p style="margin-top: 30px;">Saludos,<br>El equipo de Nuestra Tienda</p>
        </div>
      `,
      attachments: [
        {
          filename: `factura-${formattedOrderNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    }

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions)
    return info
  } catch (error) {
    console.error("Error al enviar el correo:", error)
    throw new Error(`Error al enviar el correo: ${error.message}`)
  }
}
