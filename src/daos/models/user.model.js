import { Schema, model } from "mongoose";

const userSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    googleId: { type: String, default: null }, // ID de Google, solo si el usuario se registra con Google
    password: { type: String, required: function() { return !this.googleId; } }, // Obligatorio si no hay Google Auth
    role: { type: String, enum: ["admin", "user"], default: "user" },
    cart: [{ type: Schema.Types.ObjectId, ref: "Cart" }], // Relación con carritos
});

export const userModel = model("User", userSchema);

/* 
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
}, {
    timestamps: true // Agrega createdAt y updatedAt
});

export const userModel = model("User", userSchema);
*/
