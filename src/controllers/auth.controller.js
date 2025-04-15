import jwt from "jsonwebtoken"
import { getByEmail, getByGoogleId, create } from "../services/user.services.js"
import { create as createCart } from "../services/cart.services.js"

/**
 * Maneja el éxito del login
 */
export const loginSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ error: true, message: "No autorizado" })
    }

    // Buscar el usuario en la base de datos para incluir el rol
    const userDB = await getByEmail(req.user.emails[0].value)

    if (!userDB) {
      return res.status(404).json({ error: true, message: "Usuario no encontrado en la base de datos" })
    }

    res.status(200).json({
      error: false,
      message: "Inicio de sesión exitoso",
      user: userDB,
    })
  } catch (error) {
    console.error("Error en loginSuccess:", error.message)
    res.status(500).json({ error: true, message: `Error en el servidor: ${error.message}` })
  }
}

/**
 * Maneja el fallo del login
 */
export const loginFailed = (req, res) => {
  res.status(401).json({
    error: true,
    message: "Fallo en el inicio de sesión",
  })
}

/**
 * Maneja el callback de Google OAuth
 */
export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: true, message: "Usuario no autenticado" })
    }

    // Buscar usuario existente por Google ID
    let user = await getByGoogleId(req.user.id)

    // Si no existe, crear nuevo usuario con carrito
    if (!user) {
      // Crear un carrito vacío
      const newCart = await createCart()

      // Crear el usuario con referencia al carrito
      user = await create({
        googleId: req.user.id,
        email: req.user.emails[0].value,
        role: "user",
        cart: newCart._id,
      })
    }

    // Generar token JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" })

    // Configurar cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    })

    // Redireccionar al cliente con el token
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
  } catch (error) {
    console.error("Error en googleCallback:", error.message)
    res.status(500).json({ error: true, message: `Error en el servidor: ${error.message}` })
  }
}

/**
 * Cierra la sesión del usuario
 */
export const logout = (req, res) => {
  try {
    req.logout()
    res.clearCookie("token")
    res.redirect(process.env.CLIENT_URL)
  } catch (error) {
    console.error("Error en logout:", error.message)
    res.status(500).json({ error: true, message: `Error en el servidor: ${error.message}` })
  }
}
