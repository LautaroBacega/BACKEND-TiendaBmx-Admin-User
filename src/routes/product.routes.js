import { Router } from "express";
import * as controller from "../controllers/product.controller.js";
import multer from "multer";
import path from "path";
import { ProductModel } from "../daos/models/product.model.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.delete("/:id", controller.remove);

// Configurar almacenamiento de las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para el archivo
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Tipo de archivo no permitido."));
    }
    cb(null, true);
  },
});

// Ruta para crear el producto con múltiples imágenes
router.post("/", upload.array("images", 5), controller.create); 

// Ruta para actualizar un producto con múltiples imágenes
router.put("/:id", upload.array("images", 5), controller.update);

// Ruta Filtrar productos por categoria
router.get("/category/:categoria", async (req, res) => {
  const { categoria } = req.params;
  try {
    console.log("Buscando productos en la categoría:", categoria);
    const products = await ProductModel.find({ categoria });
    console.log("Productos encontrados:", products);
    res.status(200).json(products);
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ message: "Error al obtener los productos", error });
  }
});

export default router;