import crypto from "crypto";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import type { ZodFormattedError } from "zod";
import { PasswordSchema, UserSchema } from "./schema.js";
dotenv.config();

// Start the database client
const url = process.env["MONGODB_CONNECTION_STRING"];
if (!url) {
	throw new Error("MONGODB_CONNECTION_STRING is not set");
}
const client = new MongoClient(url);
const database = client.db("code-comp");

export const Users = database.collection("users");

/**
 * Parse users with the Zod schema
 * @param {UserSchema[]} users The users to parse
 * @returns The parsed users
 */
export async function parseUsers(users: UserSchema[]) {
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
	const { validUsers, errors } = parsed.reduce(
		({ validUsers, errors }, user) => {
			if (user.success) {
				validUsers.push(user.data);
			} else {
				errors.push(user.error.format());
			}
			return { validUsers, errors };
		},
		{ validUsers: [] as UserSchema[], errors: [] as ZodFormattedError<UserSchema>[] }
	);

	if (errors.length > 0) {
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

export type PasswordValidation = {
	hash: string;
	salt: string;
};

export type ValidationResult = {
	success: boolean;
	message: string;
	errors?: {
		_errors: string[];
	} | undefined;
};

interface PasswordValidationResult extends ValidationResult {
	hash?: string;
	salt?: string;
}

export class Password {
	salt: string;
	hash: string = "";
	private parsed: ValidationResult;

	/**
	 * Prepare a password for storage
	 * @param {string} password The password to hash and salt
	 */
	constructor(password: string) {
		const parsed = PasswordSchema.safeParse(password);
		this.salt = this.generateSalt();
		this.hash = Password.generateHash(password, this.salt);
		this.parsed = {
			success: parsed.success,
			message: parsed.success ? "Password parsed successfully" : "Invalid password",
			errors: !parsed.success ? parsed.error.format() : undefined,
		};
	}

	/**
	 * Get the validation result
	 * @returns {ValidationResult} The validation result
	 */
	get result(): PasswordValidationResult {
		if (!this.parsed.success) {
			return {
				success: false,
				message: "Invalid password",
				errors: this.parsed.errors,
			};
		}
		return {
			success: true,
			message: "Password parsed successfully",
			hash: this.hash,
			salt: this.salt,
		};
	}


	/**
	 * Generate a random salt
	 * @param {number} length The length of the salt
	 * @returns {string} The generated salt
	 */
	generateSalt(length: number = 16): string {
		return crypto.randomBytes(length).toString("hex");
	}

	/**
	 * Generate a hash from a password and salt
	 * @param {string} password The password to hash
	 * @param {string} salt The salt to use
	 * @returns {string} The hashed password
	 */
	static generateHash(password: string, salt: string): string {
		return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
	}
}
