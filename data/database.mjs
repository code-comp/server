import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { PasswordSchema, UserSchema } from "./schema.mjs";
dotenv.config();

class Database {
	constructor(type = "users") {
		if (!process.env.DATABASE_PATH) {
			throw new Error("Database path environment variable not set");
		}
		this.DATABASE_PATH = path.join(process.env.DATABASE_PATH, `${type}.json`);
	}

	/**
	 * Read from the users database
	 * @returns Users from the database
	 */
	async read() {
		return await fs.readJSON(this.DATABASE_PATH);
	}

	/**
	 * Write to the users database
	 * @param {User[]} users Users to Write
	 * @param {Response} res Response object
	 * @returns Users from the database
	 */
	async write(users, res) {
		const parsed = users.map(user => {
			// Coerce the timestamps to dates
			user.metadata.created = new Date(user.metadata.created);
			user.metadata.updated = new Date(user.metadata.updated);

			// Coerce the roles into a set
			user.roles = new Set(user.roles);

			// Parse the users against the model without throwing errors
			return UserSchema.safeParse(user);
		});

		// Check if any of the users failed to parse
		const validUsers = parsed.filter(user => user.success).map(user => user.data);
		const errors = parsed.filter(user => !user.success).map(user => user.error.format());
		if (errors.length) {
			return res.status(400).json({
				success: false,
				message: "Invalid users",
				errors,
			});
		}

		// Write the valid users to the database
		await fs.writeJSON(this.DATABASE_PATH, validUsers);

		// Send the valid users with the passwords removed
		return res.json({
			success: true,
			message: "Users updated successfully",
		});
	}
}

export const database = type => new Database(type);

export class Password {
	constructor(password) {
		const parsed = PasswordSchema.safeParse(password);
		if (!parsed.success) {
			throw new Error(parsed.error.format());
		}
		this.salt = this.generateSalt();
		this.hash = this.constructor.generateHash(parsed.data, this.salt);
		return {
			salt: this.salt,
			hash: this.hash,
		};
	}

	generateSalt(length = 16) {
		return crypto.randomBytes(length).toString("hex");
	}

	static generateHash(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
	}
}
