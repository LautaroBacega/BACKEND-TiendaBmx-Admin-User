import { Router } from "express";
import passport from "passport";
import { userModel } from "../daos/models/user.model.js";
import { CartModel } from "../daos/models/cart.model.js";
import jwt from "jsonwebtoken";

const router = Router();

// Ruta para verificar el éxito del login
router.get("/login/success", async (req, res) => {
  if (req.user) {
    // Buscar el usuario en la base de datos para incluir el rol
    const userDB = await userModel.findOne({ email: req.user.emails[0].value });

    if (!userDB) {
      return res.status(404).json({ error: true, message: "Usuario no encontrado en la base de datos" });
    }

    res.status(200).json({
      error: false,
      message: "Successfully Logged In",
      user: {
        name: req.user.displayName,
        email: req.user.emails[0].value,
        picture: req.user.photos[0].value,
        role: userDB.role,
      },
    });
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" });
  }
});

// Ruta para manejar el fallo del login
router.get("/login/failed", (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
});

// Ruta para iniciar sesión con Google
router.get("/google", passport.authenticate("google", ["profile", "email"]));

// Ruta de callback de Google
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login/failed" }),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Usuario no autenticado" });

    let user = await userModel.findOne({ googleId: req.user.id });

    if (!user) {
      const newCart = await CartModel.create({ products: [] });
      user = await userModel.create({
        googleId: req.user.id,
        email: req.user.emails[0].value,
        role: "user",
        cart: newCart._id
      });
    }

    // 👇 Generar token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );
    console.log("[BACKEND] Token generado:", token); // ✅ Verificar creación
    console.log("[BACKEND] Usuario asociado:", user._id); // ✅ ID del usuario

    // 👇 Configurar cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600000 // 1 hora
    });
    console.log("[BACKEND] Cookie configurada"); // ✅ Confirmar envío de cookie

    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

// Ruta para cerrar sesión
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});

export default router;