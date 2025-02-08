import ProductDaoMongoDB from "../daos/product.dao.js";
const prodDao = new ProductDaoMongoDB();

export const getAll = async (page, limit, name, sort) => {
  try {
    return await prodDao.getAll(page, limit, name, sort);
  } catch (error) {
    console.log(error);
  }
};

export const getById = async (id) => {
  try {
    const prod = await prodDao.getById(id);
    if (!prod) return false;
    else return prod;
  } catch (error) {
    console.log(error);
  }
};

export const create = async (obj) => {
  try {
    // Asegurarse de que el objeto 'obj' tenga las imágenes como un array de URLs
    if (obj.images && Array.isArray(obj.images) && obj.images.length > 0) {
      const newProd = await prodDao.create(obj); // Llamar a 'prodDao.create' para crear el producto con las imágenes
      if (!newProd) return false;
      return newProd;
    } else {
      // Si no se proporcionan imágenes, manejar el caso según sea necesario
      throw new Error("No se proporcionaron imágenes válidas");
    }
  } catch (error) {
    console.log(error);
    throw error; // Propagar el error para que pueda ser manejado en el controlador
  }
};
export const update = async (id, obj) => {
  try {
    const prodUpd = await prodDao.update(id, obj);
    if (!prodUpd) return false;
    else return prodUpd;
  } catch (error) {
    console.log(error);
  }
};

export const remove = async (id) => {
  try {
    const prodDel = await prodDao.delete(id);
    if (!prodDel) return false;
    else return prodDel;
  } catch (error) {
    console.log(error);
  }
};
