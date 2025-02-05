import express from "express";
import { getUsers, getUserById, registerUser, loginUser } from "../controllers/user.controller.js";

const router = express.Router();

// Obtener todos los usuarios 
router.get("/users", getUsers);

// Obtener un usuario por ID - solo accesible con un token válido
router.get("/users/:id", getUserById);

// Registrar un nuevo usuario
router.post("/register", registerUser);

// Login de usuario
router.post("/login", loginUser);

export default router;