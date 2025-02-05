import * as service from "../services/product.services.js";

export const getAll = async (req, res, next) => {
  try {
    const products = await service.getAll();
    res.status(200).json(products);
  } catch (error) {
    next(error.message);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await service.getById(id);
    if (!response) res.status(404).json({ msg: "Product Not found!" });
    else res.status(200).json(response);
  } catch (error) {
    next(error.message);
  }
};

export const create = async (req, res, next) => {
  try {
    console.log(req.file); // Agrega esta línea para ver si el archivo llega
    if (!req.file) {
      return res.status(400).json({ msg: "No se ha cargado ninguna imagen." });
    }

    const productData = req.body;
    const imageUrl = `http://localhost:8080/uploads/${req.file.filename}`;

    // Crea el producto con los datos recibidos
    const newProduct = await service.create({ ...productData, image: imageUrl });

    if (!newProduct) {
      return res.status(404).json({ msg: "Error al crear el producto." });
    }

    res.status(200).json({ ...newProduct, imageUrl });
  } catch (error) {
    next(error.message);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verifica si el producto existe
    const existingProduct = await service.getById(id);
    if (!existingProduct) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    // Si se envía un archivo, actualiza la imagen
    let updatedData = req.body;
    if (req.file) {
      updatedData.image = `http://localhost:8080/uploads/${req.file.filename}`;
    }

    const prodUpd = await service.update(id, updatedData);
    res.status(200).json(prodUpd);
  } catch (error) {
    next(error.message);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prodDel = await service.remove(id);
    if (!prodDel) res.status(404).json({ msg: "Error delete product!" });
    else res.status(200).json({ msg: `Product id: ${id} deleted` });
  } catch (error) {
    next(error.message);
  }
};

export const uploadImage = (req, res) => {
  console.log(req.file); // Verificar si el archivo se está recibiendo correctamente
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No se ha cargado ninguna imagen." });
    }

    const imageUrl = `http://localhost:8080/uploads/${req.file.filename}`;
    res.status(200).json({ msg: "Imagen cargada con éxito", imageUrl });
  } catch (error) {
    res.status(500).json({ msg: "Error al cargar la imagen", error });
  }
};



export const getByCategory = async (req, res, next) => {
  const { categoria } = req.params;
  
  try {
    const productos = await ProductModel.find({ categoria }).sort({ nombre: 1 });
    
    if (productos.length === 0) {
      return res.status(404).json({ msg: "No hay productos de esta categoría" });
    }

    res.status(200).json(productos);
  } catch (error) {
    next(error.message);
  }
};

