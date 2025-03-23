/* import { Schema, model } from "mongoose";

const cartSchema = new Schema({
    products: [
        {
            _id: false,
            quantity: {
                type: Number,
                required: true 
            },
            product: {
                type: Schema.Types.ObjectId,
                ref: "products"
            }
        }
    ]
}, {
    timestamps: true
});

export const CartModel = model("carts", cartSchema); */


import { Schema, model } from "mongoose";

const cartSchema = new Schema({
    products: [
        {
            _id: false,
            quantity: {
                type: Number,
                required: true,
                min: 1 // Asegura que la cantidad sea al menos 1
            },
            product: {
                type: Schema.Types.ObjectId,
                ref: "products", // Referencia al modelo de productos
                required: true
            },
            price: {
                type: Number,
                required: true // Precio en el momento de agregar al carrito
            }
        }
    ]
}, {
    timestamps: true // Agrega createdAt y updatedAt
});

export const CartModel = model("Cart", cartSchema);

