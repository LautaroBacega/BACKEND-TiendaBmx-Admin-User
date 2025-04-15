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
      paymentMethod: String,
      trackingNumber: String,
      shippingCompany: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pendiente", "completado", "rechazado"],
      default: "pendiente",
    },
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
