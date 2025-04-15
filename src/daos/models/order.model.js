import { Schema, model } from "mongoose"

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
      },
    ],
    shippingInfo: {
      nombre: String,
      apellido: String,
      provincia: String,
      ciudad: String,
      calle: String,
      altura: String,
      codigoPostal: String,
      phone: String,
      trackingNumber: String,
      shippingCompany: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    // Eliminamos paymentStatus ya que es redundante con orderStatus
    orderStatus: [
      {
        status: {
          type: String,
          enum: ["creado", "pago aprobado", "preparando paquete", "enviado", "entregado", "cancelado"],
          default: "creado",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Agregamos el campo paymentMethod para guardar el método de pago seleccionado
    paymentMethod: {
      type: String,
      enum: ["transferencia", "mercadopago"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
)

export const OrderModel = model("Order", orderSchema)

