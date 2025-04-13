import { userModel } from "../daos/models/user.model.js"
import { CartModel } from "../daos/models/cart.model.js"
import jwt from "jsonwebtoken"

export const loginSuccess = async (req, res) => {
  if (req.user) {
    // Buscar el usuario en la base de datos para incluir el rol
    const userDB = await userModel.findOne({ email: req.user.emails[0].value }).select("-__v -createdAt -updatedAt") // Excluir campos innecesarios

    if (!userDB) {
      return res.status(404).json({ error: true, message: "Usuario no encontrado en la base de datos" })
    }

    res.status(200).json({
      error: false,
      message: "Successfully Logged In",
      user: userDB.toObject(), // Devuelve TODOS los campos del usuario
    })
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" })
  }
}

export const loginFailed = (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  })
}

export const googleCallback = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Usuario no autenticado" })

  let user = await userModel.findOne({ googleId: req.user.id })

  if (!user) {
    const newCart = await CartModel.create({ products: [] })
    user = await userModel.create({
      googleId: req.user.id,
      email: req.user.emails[0].value,
      role: "user",
      cart: newCart._id,
    })
  }

  // Generar token JWT
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" })
  console.log("[BACKEND] Token generado:", token) // Verificar creación
  console.log("[BACKEND] Usuario asociado:", user._id) // ID del usuario

  // Configurar cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  })
  console.log("[BACKEND] Cookie configurada") // Confirmar envío de cookie

  res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
}

export const logout = (req, res) => {
  req.logout()
  res.redirect(process.env.CLIENT_URL)
}
