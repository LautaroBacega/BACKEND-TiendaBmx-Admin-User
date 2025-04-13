import ProductDaoMongoDB from "../daos/product.dao.js"

const productDao = new ProductDaoMongoDB()

/**
 * Obtiene todos los productos con opciones de filtrado y paginación
 * @param {Object} options - Opciones de filtrado y paginación
 * @returns {Promise<Array>} Lista de productos
 */
export const getAll = async (options = {}) => {
  try {
    const { category, search, sort, limit, page } = options

    // Construir el objeto de consulta
    const query = {}

    if (category) {
      query.categoria = category
    }

    if (search) {
      const regex = new RegExp(search, "i")
      query.$or = [{ marca: regex }, { modelo: regex }, { descripcion: regex }]
    }

    return await productDao.getAll(query)
  } catch (error) {
    console.error("Error en getAll:", error.message)
    throw new Error(`Error al obtener productos: ${error.message}`)
  }
}

/**
 * Obtiene un producto por su ID
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Producto encontrado
 */
export const getById = async (id) => {
  try {
    const product = await productDao.getById(id)
    return product
  } catch (error) {
    console.error("Error en getById:", error.message)
    throw new Error(`Error al obtener producto por ID: ${error.message}`)
  }
}

/**
 * Obtiene productos por categoría
 * @param {string} category - Categoría de productos
 * @returns {Promise<Array>} Lista de productos
 */
export const getByCategory = async (category) => {
  try {
    const products = await productDao.getByCategory(category)
    return products
  } catch (error) {
    console.error("Error en getByCategory:", error.message)
    throw new Error(`Error al obtener productos por categoría: ${error.message}`)
  }
}

/**
 * Crea un nuevo producto
 * @param {Object} productData - Datos del producto
 * @returns {Promise<Object>} Producto creado
 */
export const create = async (productData) => {
  try {
    // Validar que el objeto tenga las imágenes como un array de URLs
    if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
      throw new Error("No se proporcionaron imágenes válidas")
    }

    const newProduct = await productDao.create(productData)
    return newProduct
  } catch (error) {
    console.error("Error en create:", error.message)
    throw new Error(`Error al crear producto: ${error.message}`)
  }
}

/**
 * Actualiza un producto existente
 * @param {string} id - ID del producto
 * @param {Object} productData - Datos actualizados del producto
 * @returns {Promise<Object>} Producto actualizado
 */
export const update = async (id, productData) => {
  try {
    const updatedProduct = await productDao.update(id, productData)
    return updatedProduct
  } catch (error) {
    console.error("Error en update:", error.message)
    throw new Error(`Error al actualizar producto: ${error.message}`)
  }
}

/**
 * Actualiza el stock de un producto
 * @param {string} id - ID del producto
 * @param {number} quantity - Cantidad a reducir del stock
 * @returns {Promise<Object>} Producto actualizado
 */
export const updateStock = async (id, quantity) => {
  try {
    const updatedProduct = await productDao.updateStock(id, quantity)
    return updatedProduct
  } catch (error) {
    console.error("Error en updateStock:", error.message)
    throw new Error(`Error al actualizar stock: ${error.message}`)
  }
}

/**
 * Elimina un producto
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Producto eliminado
 */
export const remove = async (id) => {
  try {
    const deletedProduct = await productDao.delete(id)
    return deletedProduct
  } catch (error) {
    console.error("Error en remove:", error.message)
    throw new Error(`Error al eliminar producto: ${error.message}`)
  }
}

/**
 * Busca productos por término
 * @param {string} term - Término de búsqueda
 * @returns {Promise<Array>} Lista de productos
 */
export const search = async (term) => {
  try {
    const products = await productDao.search(term)
    return products
  } catch (error) {
    console.error("Error en search:", error.message)
    throw new Error(`Error en la búsqueda de productos: ${error.message}`)
  }
}
