import passport from "passport";
import dotenv from "dotenv";
dotenv.config();

const cookieExtractor = (req) => {
	return req?.cookies?.token || null; // Extrae el token de las cookies
};

export { cookieExtractor };

// Middleware para proteger rutas con JWT
export const authenticateJWT = passport.authenticate("jwt", { session: false });