import passport from "passport";
import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const cookieExtractor = (req) => {
	return req?.cookies?.token || null; // Extrae el token de las cookies
};

export { cookieExtractor };

// Middleware para proteger rutas con JWT
export const authenticateJWT = passport.authenticate("jwt", { session: false });

export const authenticateUser = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];
	
	if (!token) {
	  return res.status(401).json({ message: "Acceso no autorizado" });
	}
  
	try {
	  const decoded = jwt.verify(token, process.env.JWT_SECRET);
	  req.user = decoded;
	  next();
	} catch (error) {
	  res.status(401).json({ message: "Token inválido o expirado" });
	}
};

export const authMiddleware = async (req, res, next) => {
	try {
	  const token = req.headers.authorization?.split(" ")[1];
	  if (!token) return res.status(401).json({ error: "Token no proporcionado" });
  
	  const decoded = jwt.verify(token, process.env.JWT_SECRET);
	  const user = await userModel.findById(decoded.id);
	  if (!user) return res.status(401).json({ error: "Usuario no existe" });
  
	  req.user = user; // Añade el usuario al request
	  next();
	} catch (error) {
	  res.status(401).json({ error: "Token inválido" });
	}
};

export const adminMiddleware = (req, res, next) => {
	if (req.user.role !== "admin") {
	  return res.status(403).json({ error: "Acceso no autorizado" });
	}
	next();
};