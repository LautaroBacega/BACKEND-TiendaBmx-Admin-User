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
  },
  {
    timestamps: true,
  }
);

export const ProductModel = model('products', productSchema);

/* 
import { Schema, model } from "mongoose";

export const productSchema = new Schema(
  {
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    categoria: { type: String, required: true },
    medida: { 
      type: Number, 
      required: true,
      min: 0 // Asegura que la medida sea un valor positivo
    },
    precioBase: { 
      type: Number, 
      required: true,
      min: 0 // Asegura que el precio base sea positivo
    },
    precioOferta: { 
      type: Number, 
      required: function() { return this.precioOferta !== undefined; }, // Opcional, pero si existe, debe ser válido
      min: 0, // Asegura que el precio de oferta sea positivo
      validate: {
        validator: function(value) {
          return value < this.precioBase; // Asegura que el precio de oferta sea menor que el precio base
        },
        message: "El precio de oferta debe ser menor que el precio base"
      }
    },
    descripcion: { type: String, required: true },
    color: { type: String, required: true },
    stock: { 
      type: Number, 
      required: true,
      min: 0 // Asegura que el stock sea un valor positivo
    },
    images: { 
      type: [String], 
      required: true,
      validate: {
        validator: function(value) {
          return value.length > 0; // Asegura que haya al menos una imagen
        },
        message: "Debe haber al menos una imagen"
      }
    },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = model('products', productSchema);
*/