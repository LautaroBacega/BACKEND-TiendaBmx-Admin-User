import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});