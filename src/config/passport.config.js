import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt"; 
import passport from "passport";
import { userModel } from "../daos/models/user.model.js";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables de entorno

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    function (accessToken, refreshToken, profile, callback) {
      callback(null, profile);
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Buscar en cookies Y headers
        (req) => {
          // 1. Buscar en cookies
          if (req.cookies.token) return req.cookies.token;
          
          // 2. Buscar en headers (para solicitudes desde el frontend)
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            return authHeader.split(" ")[1];
          }
          
          return null;
        }
      ]),
      secretOrKey: process.env.JWT_SECRET // Clave secreta desde .env
    },
    async (jwtPayload, done) => {
      try {
        const user = await userModel.findById(jwtPayload.id);
        user ? done(null, user) : done(null, false);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});