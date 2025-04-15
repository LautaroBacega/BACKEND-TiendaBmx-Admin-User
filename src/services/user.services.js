import mongoose from "mongoose"
import UserDaoMongoDB from "../daos/user.dao.js"

const userDao = new UserDaoMongoDB()

/**
 * Obtiene todos los usuarios
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAll = async () => {
  try {
    return await userDao.getAll()
  } catch (error) {
    console.error("Error en getAll:", error.message)
    throw new Error(`Error al obtener usuarios: ${error.message}`)
  }
}

/**
 * Obtiene un usuario por su ID
 * @param {string} id - ID del usuario
 * @returns {Promise<Object>} Usuario encontrado
 */
export const getById = async (id) => {
  try {
    // Validar que el ID sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`ID de usuario inválido: ${id}`)
    }

    const user = await userDao.getById(id)
    if (!user) {
      throw new Error(`Usuario con ID ${id} no encontrado`)
    }
    return user
  } catch (error) {
    console.error("Error en getById:", error.message)
    throw new Error(`Error al obtener usuario por ID: ${error.message}`)
  }
}

/**
 * Obtiene un usuario por su email
 * @param {string} email - Email del usuario
 * @returns {Promise<Object>} Usuario encontrado
 */
export const getByEmail = async (email) => {
  try {
    const user = await userDao.getByEmail(email)
    return user
  } catch (error) {
    console.error("Error en getByEmail:", error.message)
    throw new Error(`Error al obtener usuario por email: ${error.message}`)
  }
}

/**
 * Obtiene un usuario por su Google ID
 * @param {string} googleId - ID de Google del usuario
 * @returns {Promise<Object>} Usuario encontrado
 */
export const getByGoogleId = async (googleId) => {
  try {
    const user = await userDao.getByGoogleId(googleId)
    return user
  } catch (error) {
    console.error("Error en getByGoogleId:", error.message)
    throw new Error(`Error al obtener usuario por Google ID: ${error.message}`)
  }
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export const create = async (userData) => {
  try {
    const newUser = await userDao.create(userData)
    return newUser
  } catch (error) {
    console.error("Error en create:", error.message)
    throw new Error(`Error al crear usuario: ${error.message}`)
  }
}

/**
 * Actualiza un usuario existente
 * @param {string} id - ID del usuario
 * @param {Object} userData - Datos actualizados del usuario
 * @returns {Promise<Object>} Usuario actualizado
 */
export const update = async (id, userData) => {
  try {
    const updatedUser = await userDao.update(id, userData)
    return updatedUser
  } catch (error) {
    console.error("Error en update:", error.message)
    throw new Error(`Error al actualizar usuario: ${error.message}`)
  }
}

/**
 * Actualiza la información de envío de un usuario
 * @param {string} id - ID del usuario
 * @param {Object} shippingInfo - Información de envío
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateShippingInfo = async (id, shippingInfo) => {
  try {
    const updatedUser = await userDao.updateShippingInfo(id, shippingInfo)
    return updatedUser
  } catch (error) {
    console.error("Error en updateShippingInfo:", error.message)
    throw new Error(`Error al actualizar información de envío: ${error.message}`)
  }
}

/**
 * Elimina un usuario
 * @param {string} id - ID del usuario
 * @returns {Promise<Object>} Usuario eliminado
 */
export const remove = async (id) => {
  try {
    const deletedUser = await userDao.delete(id)
    return deletedUser
  } catch (error) {
    console.error("Error en remove:", error.message)
    throw new Error(`Error al eliminar usuario: ${error.message}`)
  }
}
