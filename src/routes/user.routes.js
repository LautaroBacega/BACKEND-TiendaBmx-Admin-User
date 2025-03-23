import express from "express";
import { getUsers, getUserById } from "../controllers/user.controller.js";

const router = express.Router();

// Obtener todos los usuarios (solo para administradores)
router.get("/users", getUsers);

// Obtener un usuario por ID (solo para administradores)
router.get("/users/:id", getUserById);

export default router;