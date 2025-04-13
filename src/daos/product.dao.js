import { ProductModel } from "./models/product.model.js"

export default class ProductDaoMongoDB {
  async getAll(query = {}) {
    try {
      const products = await ProductModel.find(query)
      return products
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`)
    }
  }

  async getById(id) {
    try {
      const product = await ProductModel.findById(id)
      if (!product) {
        throw new Error(`Producto con ID ${id} no encontrado`)
      }
      return product
    } catch (error) {
      throw new Error(`Error al obtener el producto: ${error.message}`)
    }
  }

  async getByCategory(category) {
    try {
      return await ProductModel.find({ categoria: category })
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`)
    }
  }

  async create(productData) {
    try {
      // Verificar que 'images' sea un array de URLs
      if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
        throw new Error("Las imágenes no son válidas o están vacías")
      }

      const newProduct = await ProductModel.create(productData)
      return newProduct
    } catch (error) {
      throw new Error(`Error al crear el producto: ${error.message}`)
    }
  }

  async update(id, productData) {
    try {
      const updatedProduct = await ProductModel.findByIdAndUpdate(id, productData, { new: true })

      if (!updatedProduct) {
        throw new Error(`Producto con ID ${id} no encontrado`)
      }

      return updatedProduct
    } catch (error) {
      throw new Error(`Error al actualizar el producto: ${error.message}`)
    }
  }

  async updateStock(id, quantity) {
    try {
      const product = await ProductModel.findById(id)
      if (!product) {
        throw new Error(`Producto con ID ${id} no encontrado`)
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente para el producto ${product.modelo}`)
      }

      product.stock -= quantity
      return await product.save()
    } catch (error) {
      throw new Error(`Error al actualizar el stock: ${error.message}`)
    }
  }

  async delete(id) {
    try {
      const deletedProduct = await ProductModel.findByIdAndDelete(id)

      if (!deletedProduct) {
        throw new Error(`Producto con ID ${id} no encontrado`)
      }

      return deletedProduct
    } catch (error) {
      throw new Error(`Error al eliminar el producto: ${error.message}`)
    }
  }

  async search(term) {
    try {
      const regex = new RegExp(term, "i")
      return await ProductModel.find({
        $or: [{ marca: regex }, { modelo: regex }, { descripcion: regex }, { categoria: regex }],
      })
    } catch (error) {
      throw new Error(`Error en la búsqueda de productos: ${error.message}`)
    }
  }
}
