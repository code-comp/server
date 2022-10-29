import { Router } from "express";
import jwt from "jsonwebtoken";
import { database, Password } from "../../data/database.mjs";
import { PasswordSchema } from "../../data/schema.mjs";
const db = database("users");

const router = Router();

// Authentication endpoint
router
	.route("/")

	// POST /api/auth
	.post(async (req, res) => {
		// Find the user in the database
		const users = await db.read();
		const user = users.find(user => user.id === req.body.id || user.username === req.body.username);

		// Check if the user exists
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found",
			});
		}

		// Check if the password is correct
		const validation = validate(req.body.password, user.password);
		if (user && validation.success) {
			res.status(200).json({
				success: true,
				message: `Authentication successful! ${validation.message}. Welcome, ${user.username}!`,
				token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
					expiresIn: "24h",
				}),
			});
		} else {
			res.status(403).json({
				success: false,
				message: "Incorrect username or password",
				error: validation.error,
			});
		}
	})

	// OPTIONS /api/auth
	.options(async (req, res) => {
		// Allow CORS preflight
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Methods", "POST");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		res.set("Access-Control-Max-Age", "3600");
		res.set("Allow", "POST");
		res.status(204).end();
	})

	// All other methods
	.all(async (req, res) => {
		res.set("Allow", "POST");
		return res.status(405).json({
			success: false,
			message: "Method not allowed",
		});
	});

/**
 * Checks if the password is valid
 * @param {string} password The password to check
 * @param {string} hash The hash stored in the database to check against
 * @returns {object} The validation result
 */
function validate(password, { hash, salt }) {
	password = PasswordSchema.safeParse(password);
	if (!password.success) {
		return {
			success: false,
			message: "Invalid password",
			error: password.error.format(),
		};
	}
	if (hash === Password.generateHash(password.data, salt)) {
		return {
			success: true,
			message: "Password is correct",
		};
	} else {
		return {
			success: false,
			message: "Password is incorrect",
		};
	}
}

export function isAuthenticated(req, res, next) {
	// Check if the user is authenticated
	if (req.headers.authorization) {
		// Get the token from the header
		const token = req.headers.authorization.split(" ")[1];
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = decoded;
			next();
		} catch (err) {
			return res.status(401).json({
				success: false,
				message: "Invalid token",
			});
		}
	} else if (req.path === "/auth" || req.method === "OPTIONS") {
		next();
	} else {
		return res.status(401).json({
			success: false,
			message: "No token provided",
		});
	}
}

export default router;
