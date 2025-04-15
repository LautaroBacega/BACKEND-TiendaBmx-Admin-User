import * as userService from "../services/user.services.js"

/**
 * Obtiene todos los usuarios
 */
export const getUsers = async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

    const users = await userService.getAll()
    res.status(200).json(users)
  } catch (error) {
    console.error("Error en getUsers:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene un usuario por su ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    // Validar que el ID sea un ObjectId válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "ID de usuario inválido" })
    }

    // Verificar si el usuario es administrador o es el propio usuario
    if (req.user && req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({ error: "Acceso no autorizado" })
    }

    const user = await userService.getById(id)

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error("Error en getUserById:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Actualiza un usuario
 */
export const updateUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const updatedUser = await userService.update(req.user.id, req.body)

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // Modificar la respuesta para incluir el usuario actualizado en el formato esperado por el cliente
    res.status(200).json({
      message: "Usuario actualizado correctamente",
      updatedUser: updatedUser,
    })
  } catch (error) {
    console.error("Error en updateUser:", error.message)
    res.status(400).json({ error: error.message })
  }
}

/**
 * Actualiza la información de envío de un usuario
 */
export const updateShippingInfo = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const { nombre, apellido, provincia, ciudad, calle, altura, codigoPostal, phone } = req.body

    // Validar campos requeridos
    if (!nombre || !apellido || !provincia || !ciudad || !calle || !altura || !codigoPostal || !phone) {
      return res.status(400).json({ error: "Todos los campos de envío son requeridos" })
    }

    const updatedUser = await userService.updateShippingInfo(req.user.id, {
      nombre,
      apellido,
      provincia,
      ciudad,
      calle,
      altura,
      codigoPostal,
      phone,
    })

    res.status(200).json({ message: "Información de envío actualizada", user: updatedUser })
  } catch (error) {
    console.error("Error en updateShippingInfo:", error.message)
    res.status(400).json({ error: error.message })
  }
}
