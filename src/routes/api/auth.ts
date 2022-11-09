import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Password, PasswordValidation, Users, ValidationResult } from "../../data/database.js";
import { PasswordSchema } from "../../data/schema.js";

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined");
}

const router = Router();

// Authentication endpoint
router
	.route("/")

	// POST /api/auth
	.post(async (req: Request, res: Response) => {
		// Find the user in the database
		const user = await Users.findOne({ $or: [{ id: req.body.id }, { username: req.body.username }] });

		// Check if the user exists
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found",
			});
		}
		// Check if the password is correct
		const validation = validate(req.body.password, user?.["password"]);
		if (user && validation.success) {
			return res.status(200).json({
				success: true,
				message: `Authentication successful! ${validation.message}. Welcome, ${user["username"]}!`,
				id: user["id"],
				token: jwt.sign({ id: user["id"] }, JWT_SECRET, {
					expiresIn: "24h",
				}),
			});
		} else {
			return res.status(403).json({
				success: false,
				message: "Incorrect username or password",
				error: validation.errors,
			});
		}
	})

	// All other methods
	.all(async (_req: Request, res: Response) => {
		res.set("Allow", "POST");
		return res.status(405).json({
			success: false,
			message: "Method not allowed",
		});
	});

/**
 * Checks if the password is valid
 * @param {string} password The password to validate
 * @param {PasswordValidation} validation The validation object
 * @returns {ValidationResult} The validation result
 */
function validate(password: string, { hash, salt }: PasswordValidation): ValidationResult {
	const parsed = PasswordSchema.safeParse(password);
	if (!parsed.success) {
		return {
			success: false,
			message: "Invalid password",
			errors: parsed.error.format(),
		};
	}
	if (hash === Password.generateHash(parsed.data, salt)) {
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

/**
 * Check if the user is authenticated
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
	if (!JWT_SECRET) {
		throw new Error("JWT_SECRET is not defined");
	}

	// Get the token from the header
	const token = req.headers.authorization?.split(" ")[1];
	if (token) {
		let decoded: JwtPayload | undefined;
		try {
			decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
		} catch (err) {
			return res.status(401).json({
				success: false,
				message: "Invalid token",
			});
		}
		if (decoded) {
			if (decoded.exp ?? 0 > Date.now() / 1000) {
				// Token is valid
				req.user = {
					id: decoded["id"],
				};
				next();
			} else {
				// Token is expired
				return res.status(401).json({
					success: false,
					message: "Token is expired",
				});
			}
		}
	} else if (req.path === "/auth" || (req.method === "POST" && req.path === "/users")) {
		return next();
	} else {
		return res.status(401).json({
			success: false,
			message: "No token provided",
		});
	}
}

export default router;
