import { Router } from "express";
import * as controller from "../controllers/product.controller.js";
import multer from "multer";
import path from "path";

const router = Router();

router.get("/", controller.getAll);

router.get("/:id", controller.getById);

/* router.post("/", controller.create); */



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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido.'));
    }
    cb(null, true);
  },
});

// Ruta para crear el producto y cargar la imagen
router.post('/', upload.single('image'), controller.create);

router.put("/:id", upload.single("image"), controller.update);

export default router;
