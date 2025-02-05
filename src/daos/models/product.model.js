import { Schema, model } from "mongoose";

export const productSchema = new Schema(
  {
    name: { type: String, required: true },
    marca: { type: String, required: true },
    medida: { type: Number, required: true },
    category: { type: String, required: true },
    tipo: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    description: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true },
    image: { type: String, required: true },
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

