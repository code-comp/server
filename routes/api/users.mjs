import crypto from "crypto";
import * as Express from "express";
import { Router } from "express";
import { database, Password } from "../../data/database.mjs";
const db = database("users");

const router = Router();

// Users endpoint
router
	.route("/")

	// GET /api/users (admin only)
	.get(async (req, res) => {
		// Read from the database
		const users = await db.read();

		if (!users.find(user => user.id === req.user.id)?.roles?.includes("admin")) {
			return res.status(403).json({
				success: false,
				message: "Forbidden",
			});
		}

		// Remove passwords from the response
		return res.json({
			success: true,
			message: "Users retrieved successfully",
			users: users.map(user => {
				delete user.password;
				return user;
			}),
		});
	})

	// POST /api/users
	.post(async (req, res) => {
		// Read from the database
		const users = await db.read();

		// Add a new user to the database
		users.push({
			...req.body,
			id: crypto.randomUUID(),
			password: new Password(req.body.password),
			metadata: {
				created: new Date(),
				updated: new Date(),
			},
		});
		await db.write(users, res);
	})

	// OPTIONS /api/users
	.options(async (req, res) => {
		// Allow CORS preflight
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Methods", "POST");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		res.set("Access-Control-Max-Age", "3600");
		res.set("Allow", "GET, POST");
		res.status(204).end();
	})

	// All other methods
	.all(async (req, res) => {
		res.set("Allow", "GET, POST");
		return res.status(405).json({
			success: false,
			message: "Method not allowed",
		});
	});

// Get the user by ID
router
	.route("/:id")

	// GET /api/users/:id
	.get(isAuthorized, async (req, res) => {
		const users = await db.read();

		// Find the user in the database
		const index = findIndex(users, req, res);
		// Error if the user is not found
		if (index === -1) return;

		// Remove the password from the response
		delete users[index].password;

		// Send the user data
		return res.json({
			success: true,
			message: "User retrieved successfully",
			user: users[index],
		});
	})

	// PUT /api/users/:id
	.put(isAuthorized, async (req, res) => {
		// Find the user in the database
		const users = await db.read();
		const index = findIndex(users, req, res);
		if (index === -1) return;

		// Replace the user data in the database
		users[index] = {
			...req.body,
			id: users[index].id,
			password: new Password(req.body.password),
			metadata: {
				created: users[index].metadata.created,
				updated: new Date(),
			},
		};
		await db.write(users, res);
	})

	// PATCH /api/users/:id
	.patch(isAuthorized, async (req, res) => {
		// Find the user in the database
		const users = await db.read();
		const index = findIndex(users, req, res);
		if (index === -1) return;

		// Update the user data in the database
		users[index] = {
			...users[index],
			...req.body,
			password: new Password(req.body.password),
			id: users[index].id,
			metadata: {
				created: users[index].metadata.created,
				updated: new Date(),
			},
		};
		await db.write(users, res);
	})

	// DELETE /api/users/:id
	.delete(isAuthorized, async (req, res) => {
		// Find the user in the database
		const users = await db.read();
		const index = findIndex(users, req, res);
		if (index === -1) return;

		// Remove the user from the database
		users.splice(index, 1);
		await db.write(users, res);
	})

	// OPTIONS /api/users/:id
	.options(async (req, res) => {
		// Allow CORS preflight
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Methods", "POST");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		res.set("Access-Control-Max-Age", "3600");
		res.set("Allow", "GET, PUT, PATCH, DELETE");
		res.status(204).end();
	})

	// All other methods
	.all(async (req, res) => {
		res.set("Allow", "GET, PUT, PATCH, DELETE");
		return res.status(405).json({
			success: false,
			message: "Method not allowed",
		});
	});

/**
 * Check if the user is authorized
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 */
function isAuthorized(req, res, next) {
	if (req.user?.id !== req.params.id) {
		console.log(req.user, req.params.id);
		res.status(403).json({
			success: false,
			message: "Forbidden",
		});
	} else {
		next();
	}
}

/**
 * Find the index of a user in the database
 * @param {User[]} users Users from the database
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @returns Index of the user in the database or -1 if not found
 */
function findIndex(users, req, res) {
	// Find the user in the database
	const index = users.findIndex(user => user.id === req.params.id);

	// Error if the user is not found
	if (!users[index]) {
		res.status(404).json({
			success: false,
			message: "User not found",
		});
		return -1;
	}

	// Return the index of the user
	return index;
}

export default router;
