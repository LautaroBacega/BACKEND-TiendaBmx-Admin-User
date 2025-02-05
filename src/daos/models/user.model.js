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
