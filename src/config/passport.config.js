import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { cookieExtractor } from "../middleware/auth.middleware.js";
import dotenv from "dotenv";
import { userModel } from "../daos/models/user.model.js";
dotenv.config();

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
	"jwt",
	new JWTStrategy(
	  {
		jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), // Cambiado correctamente
		secretOrKey: process.env.JWT_SECRET, // Asegúrate de que este valor esté definido en tu archivo .env
	  },
	  async (payload, done) => {
		try {
		  const user = await userModel.findById(payload.id);
		  if (!user) return done(null, false, { message: "Usuario no encontrado" });
		  return done(null, user);
		} catch (err) {
		  return done(err, false);
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
