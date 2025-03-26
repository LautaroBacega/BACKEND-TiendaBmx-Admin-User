import { userModel } from "../daos/models/user.model.js";

// Obtener todos los usuarios (solo para administradores)
export const getUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los usuarios", error });
  }
};

// Obtener un usuario por ID (solo para administradores)
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el usuario", error });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log("[BACKEND] ID del usuario recibido:", req.user.id);
    console.log("[BACKEND] Datos a actualizar:", req.body);

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    console.log("[BACKEND] Usuario actualizado en DB:", updatedUser); // ¿Se ve en consola?

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario actualizado exitosamente", updatedUser });
  } catch (error) {
    console.error("[BACKEND] Error al actualizar:", error);
    res.status(400).json({ message: "Error al actualizar", error: error.message });
  }
};