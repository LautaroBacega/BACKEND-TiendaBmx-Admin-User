import express from "express";
import { getUsers, getUserById, updateUser } from "../controllers/user.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// Obtener todos los usuarios (solo para administradores)
router.get("/users", getUsers);

// Obtener un usuario por ID (solo para administradores)
router.get("/users/:id", getUserById);

router.put("/users/update",authenticateUser, updateUser);

export default router;