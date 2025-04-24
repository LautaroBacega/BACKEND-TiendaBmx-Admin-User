import dotenv from "dotenv"
dotenv.config()
import express from "express"
import cors from "cors"
import passport from "passport"
import authRoute from "./routes/auth.routes.js"
import cookieSession from "cookie-session"
import "./config/passport.config.js"
import { initMongoDB } from "./db/database.js"
import cookieParser from "cookie-parser"

import cartRoutes from "./routes/cart.routes.js"
import userRoutes from "./routes/user.routes.js"
import productRoutes from "./routes/product.routes.js"
import orderRoutes from "./routes/order.routes.js"

import path from "path"
import { fileURLToPath } from "url"

const app = express()
const port = process.env.PORT || 8080

// Obtener la ruta del directorio actual con 'import.meta.url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(cookieParser())
app.use(
  cookieSession({
    name: "session",
    keys: ["cyberwolve"],
    maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  }),
)

app.use(passport.initialize())
app.use(passport.session())

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// RUTAS
app.use("/auth", authRoute)
app.use("/api/cart", cartRoutes)
app.use("/api", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

initMongoDB()
app.listen(port, () => console.log(`Listenting on port ${port}...`))
