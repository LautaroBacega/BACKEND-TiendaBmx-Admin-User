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