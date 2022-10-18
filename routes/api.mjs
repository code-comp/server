import express, { Router } from "express";
import auth from "./api/auth.mjs";
import users from "./api/users.mjs";

const router = Router();

// Middleware to check if the user is authenticated
/* router.use(async (req, res, next) => {
	// Check if the user is authenticated
	if (req.headers.authorization) {
		const token = req.headers.authorization.split(" ")[1];
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			// Check if the user is an admin
			const users = await read();
			const user = users.find(user => user.username === decoded.username);
			if (user && user.admin) {
				return next();
			}
		} catch (err) {
			return res.status(401).json({
				success: false,
				message: "Invalid token",
			});
		}
	} else {
		return res.status(401).json({
			success: false,
			message: "No token provided",
		});
	}
	return res.status(403).json({
		success: false,
		message: "Forbidden",
	});
}); */

// Parse the body of the request
router.use(express.json());

// API endpoints
router.use("/auth", auth);
router.use("/users", users);

export default router;
