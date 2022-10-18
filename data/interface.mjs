import fs from "fs-extra";
import dotenv from "dotenv";
import { User } from "./model.mjs";
dotenv.config();

const { DATABASE_PATH = "" } = process.env;
if (!DATABASE_PATH) {
	console.log(process.env.DATABASE_PATH)
	throw new Error("Database path environment variable not set");
}

/**
 * Read from the users database
 * @returns Users from the database
 */
export async function read() {
	return await fs.readJSON(DATABASE_PATH);
}

/**
 * Write to the users database
 * @param {User[]} users Users to Write
 * @param {Response} res Response object
 * @returns Users from the database
 */
export async function write(users, res) {
	const parsed = users.map(user => {
		// Coerce the timestamps to dates
		user.metadata.created = new Date(user.metadata.created);
		user.metadata.updated = new Date(user.metadata.updated);

		// Parse the users against the model without throwing errors
		return User.safeParse(user);
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
	await fs.writeJSON(DATABASE_PATH, validUsers);

	// Send the valid users with the passwords removed
	return res.json({
		success: true,
		message: "Users updated successfully",
		users: validUsers.map(user => {
			delete user.password;
			return user;
		}),
	});
}
