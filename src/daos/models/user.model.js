import { Schema, model } from "mongoose";

const userSchema = new Schema({
    email: { 
        type: String, 
        unique: true, 
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Por favor, ingresa un email válido"] // Validación de formato
    },
    googleId: { type: String, required: true, unique: true }, // ID de Google, obligatorio y único
    role: { type: String, enum: ["admin", "user"], default: "user" }, // Rol del usuario
    cart: { 
        type: Schema.Types.ObjectId, 
        ref: "Cart" // Referencia única al carrito activo
    },
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "Order",
        default: []
    }],
    nombre: { type: String, default: "" },
    apellido: { type: String, default: "" },
    provincia: { type: String, default: "" },
    ciudad: { type: String, default: "" },
    calle: { type: String, default: "" },
    altura: { type: String, default: "" },
    codigoPostal: { type: String, default: "" },
    phone: { type: String, default: "" },
}, {
    timestamps: true // Agrega createdAt y updatedAt
});

export const userModel = model("User", userSchema);