import { Router } from "express"
import passport from "passport"
import { loginSuccess, loginFailed, googleCallback, logout } from "../controllers/auth.controller.js"

const router = Router()

// Ruta para verificar el éxito del login
router.get("/login/success", loginSuccess)

// Ruta para manejar el fallo del login
router.get("/login/failed", loginFailed)

// Ruta para iniciar sesión con Google
router.get("/google", passport.authenticate("google", ["profile", "email"]))

// Ruta de callback de Google
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login/failed" }), googleCallback)

// Ruta para cerrar sesión
router.get("/logout", logout)

export default router
