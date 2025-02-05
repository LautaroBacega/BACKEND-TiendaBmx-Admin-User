import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { userModel } from "../daos/models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

router.get("/login/success", (req, res) => {
	console.log('Usuario en sesión:', req.user);
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Loged In",
			user: req.user,
		});
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
	}
});

router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Log in failure",
	});
});

router.get("/google", 
	passport.authenticate("google", ["profile", "email"])
);

router.get("/google/callback",
	passport.authenticate("google", { failureRedirect: "/login/failed" }),
	async (req, res) => {
	  console.log(req.user); // Verifica la estructura de req.user
	  
	  if (!req.user) {
		return res.status(401).json({ message: "Usuario no autenticado" });
	  }
  
	  let user = await userModel.findOne({ googleId: req.user.id });
  
	  if (!user) {
		user = await userModel.create({
		  googleId: req.user.id,
		  first_name: req.user.name.givenName,
		  last_name: req.user.name.familyName,
		  email: req.user.emails[0].value,
		  role: "user",
		});
	  }
  
	  // Generar el token
	  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

	  // ✅ Imprimir el token en la consola del backend (VS Code)
	  console.log("JWT Token generado:", token);
  
	  // Redirigir al frontend con el token en la URL
	  /* res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`); */
	  res.redirect(`${process.env.CLIENT_URL}`);
	}
);

router.get("/logout", (req, res) => {
	console.log('Usuario sesión cerrada:', req.user);
	req.logout();
	res.redirect(process.env.CLIENT_URL);
});

export default router;