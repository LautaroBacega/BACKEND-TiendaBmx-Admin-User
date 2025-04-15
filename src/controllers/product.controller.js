import * as productService from "../services/product.services.js"

/**
 * Obtiene todos los productos
 */
export const getAll = async (req, res, next) => {
  try {
    // Extraer parámetros de consulta para filtrado y paginación
    const { category, search, sort, limit, page } = req.query

    const options = {
      category,
      search,
      sort,
      limit: limit ? Number.parseInt(limit) : undefined,
      page: page ? Number.parseInt(page) : undefined,
    }

    const products = await productService.getAll(options)
    res.status(200).json(products)
  } catch (error) {
    console.error("Error en getAll:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene un producto por su ID
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params
    const product = await productService.getById(id)

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    res.status(200).json(product)
  } catch (error) {
    console.error("Error en getById:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Obtiene productos por categoría
 */
export const getByCategory = async (req, res, next) => {
  try {
    const { categoria } = req.params
    const products = await productService.getByCategory(categoria)

    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No hay productos en esta categoría" })
    }

    res.status(200).json(products)
  } catch (error) {
    console.error("Error en getByCategory:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Crea un nuevo producto
 */
export const create = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se han cargado imágenes" })
    }

    // Mapeo de rutas de las imágenes subidas
    const imageUrls = req.files.map(
      (file) => `${process.env.API_URL || "http://localhost:8080"}/uploads/${file.filename}`,
    )

    // Crea el nuevo producto con las imágenes
    const productData = { ...req.body, images: imageUrls }
    const newProduct = await productService.create(productData)

    res.status(201).json(newProduct)
  } catch (error) {
    console.error("Error en create:", error.message)
    res.status(400).json({ error: error.message })
  }
}

/**
 * Actualiza un producto existente
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const updatedData = req.body

    // Si hay archivos nuevos, actualizar las imágenes
    if (req.files && req.files.length > 0) {
      updatedData.images = req.files.map(
        (file) => `${process.env.API_URL || "http://localhost:8080"}/uploads/${file.filename}`,
      )
    }

    const updatedProduct = await productService.update(id, updatedData)

    if (!updatedProduct) {
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    res.status(200).json(updatedProduct)
  } catch (error) {
    console.error("Error en update:", error.message)
    res.status(400).json({ error: error.message })
  }
}

/**
 * Elimina un producto
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedProduct = await productService.remove(id)

    if (!deletedProduct) {
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    res.status(200).json({ message: `Producto con ID ${id} eliminado correctamente` })
  } catch (error) {
    console.error("Error en remove:", error.message)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Busca productos por término
 */
export const search = async (req, res, next) => {
  try {
    const { term } = req.query

    if (!term) {
      return res.status(400).json({ error: "Se requiere un término de búsqueda" })
    }

    const products = await productService.search(term)
    res.status(200).json(products)
  } catch (error) {
    console.error("Error en search:", error.message)
    res.status(500).json({ error: error.message })
  }
}
