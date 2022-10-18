import crypto from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { read } from "../../data/interface.mjs";

const router = Router();

// Authentication endpoint
router
	.route("/")

	// POST /api/auth
	.post(async (req, res) => {
		// Find the user in the database
		const users = await read();
		const user = users.find(user => user.id === req.body.id || user.username === req.body.username);

		// Check if the user exists
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found",
			});
		}

		// Check if the password is correct
		if (user && Password.validate(req.body.password, user.password.hash, user.password.salt)) {
			res.status(200).json({
				success: true,
				message: "Authentication successful!",
				token: jwt.sign(user, process.env.JWT_SECRET, {
					expiresIn: "24h",
				}),
			});
		} else {
			res.status(403).json({
				success: false,
				message: "Incorrect username or password",
			});
		}
	})

	// All other methods
	.all(async (req, res) => {
		return res.status(405).json({
			success: false,
			message: "Method not allowed",
		});
	});

export class Password {
	constructor(password) {
		password = z
			.string({ message: "Password must be a string" })
			.min(8, { message: "Password must be at least 8 characters long" })
			.max(32, { message: "Password must be at most 32 characters long" })
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,32}$/, {
				message:
					"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			})
			.parse(password);
		this.salt = Password.generateSalt();
		this.hash = Password.generateHash(password, this.salt);
		return {
			salt: this.salt,
			hash: this.hash,
		};
	}

	static validate(password, hash, salt) {
		return hash === Password.generateHash(password, salt);
	}

	static generateSalt() {
		return crypto.randomBytes(16).toString("hex");
	}

	static generateHash(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
	}
}

export default router;
