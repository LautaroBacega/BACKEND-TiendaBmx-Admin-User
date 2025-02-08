import { Schema, model } from "mongoose";

export const productSchema = new Schema(
  {
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    categoria: { type: String, required: true },
    medida: { type: Number, required: true },
    precioBase: { type: Number, required: true },
    precioOferta: { type: Number, required: true },
    descripcion: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true },
    images: { type: [String], required: true },
    /* image2: { type: String },
    image3: { type: String},
    image4: { type: String },
    image5: { type: String}, */
  },
  {
    timestamps: true,
  }
);

export const ProductModel = model('products', productSchema);

