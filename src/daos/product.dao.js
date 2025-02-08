import { ProductModel } from "./models/product.model.js";

export default class ProductDaoMongoDB {
  async getAll ()  {
    try {
      const products = await ProductModel.find(); // Trae todos los productos
      return products;
    } catch (error) {
      throw new Error(`Error retrieving products: ${error.message}`);
    }
  };

  async getById(id) {
    try {
      const response = await ProductModel.findById(id);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async create(obj) {
    try {
      // Verificar que 'images' sea un array de URLs
      if (obj.images && Array.isArray(obj.images) && obj.images.length > 0) {
        const newProduct = await ProductModel.create(obj); // Crear el producto
        return newProduct;
      } else {
        throw new Error("Las imágenes no son válidas o están vacías.");
      }
    } catch (error) {
      console.log(error);
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  async update(id, obj) {
    try {
      const response = await ProductModel.findByIdAndUpdate(id, obj, {
        new: true,
      });
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async delete(id) {
    try {
      const response = await ProductModel.findByIdAndDelete(id);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
}
