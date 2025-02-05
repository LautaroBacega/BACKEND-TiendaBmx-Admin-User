import dotenv from "dotenv";
dotenv.config();
import express from "express";
import session from 'express-session';
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import authRoute from "./routes/auth.routes.js";
import cookieSession from "cookie-session";
import "./config/passport.config.js";
import { initMongoDB } from "./db/database.js";
import cookieParser from "cookie-parser"; 

import cartRoutes from "./routes/cart.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";

import path from "path";
import { fileURLToPath } from 'url';
import { ProductModel } from "./daos/models/product.model.js";

const app = express();
const port = process.env.PORT || 8080;

// Obtener la ruta del directorio actual con 'import.meta.url'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cookieParser());
app.use(
	cookieSession({
		name: "session",
		keys: ["cyberwolve"],
		maxAge: 24 * 60 * 60 * 1000,
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
	cors({
		origin: "http://localhost:3000",
		methods: "GET,POST,PUT,DELETE",
		credentials: true,
	})
);

// RUTAS
app.use("/auth", authRoute);
app.use("/api/cart", cartRoutes);
app.use("/api", userRoutes);
app.get("/api/products/category/:categoria", async (req, res) => {
	const { categoria } = req.params;
	try {
	  console.log("Buscando productos en la categoría:", categoria); // Verificar si llega el parámetro
	  const products = await ProductModel.find({ categoria });
	  console.log("Productos encontrados:", products); // Verificar qué trae la base de datos
	  res.status(200).json(products);
	} catch (error) {
	  console.error("Error en la consulta:", error); // Mostrar error detallado en la terminal
	  res.status(500).json({ message: "Error al obtener los productos", error });
	}
  });

console.log(path.join(__dirname, 'uploads'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


initMongoDB();
app.listen(port, () => console.log(`Listenting on port ${port}...`));
