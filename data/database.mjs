import crypto from "crypto";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { PasswordSchema, UserSchema } from "./schema.mjs";
dotenv.config();

// Start the database client
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
const database = client.db("code-comp");

export const Users = database.collection("users");

/**
 * Parse users with the Zod schema
 * @param {object[]} users The users to parse
 * @returns The parsed users
 */
export async function parseUsers(users) {
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
		return {
			success: false,
			message: "Invalid users",
			errors,
		};
	}

	return {
		success: true,
		message: "Users parsed successfully",
		users: validUsers,
	};
}

export class Password {
	/**
	 * Prepare a password for storage
	 * @param {string} password The password to hash and salt
	 * @returns {object} The hashed and salted password
	 */
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

	/**
	 * Generate a random salt
	 * @param {number} length The length of the salt
	 * @returns {string} The generated salt
	 */
	generateSalt(length = 16) {
		return crypto.randomBytes(length).toString("hex");
	}

	/**
	 * Generate a hash from a password and salt
	 * @param {string} password The password to hash
	 * @param {string} salt The salt to use
	 * @returns {string} The hashed password
	 */
	static generateHash(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
	}
}
