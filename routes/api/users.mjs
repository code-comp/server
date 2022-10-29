import crypto from "crypto";
import * as Express from "express";
import { Router } from "express";
import { parseUsers, Password, Users } from "../../data/database.mjs";

const router = Router();

// Users endpoint
router
	.route("/")

	// GET /api/users (admin only)
	.get(async (req, res) => {
		// Find all users
		const users = Users.find({});

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
		// Parse the users
		const parsed = parseUsers(
			req.body.map(user => ({
				...user,
				id: crypto.randomUUID(),
				password: new Password(user.password),
				metadata: {
					created: new Date(),
					updated: new Date(),
				},
			}))
		);

		if (!parsed.success) {
			return res.status(400).json(parsed);
		}

		// Insert the users into the database
		await Users.insertMany(parsed.users);

		// Remove passwords from the response
		return res.status(201).json({
			success: true,
			message: "Users created successfully",
			users: parsed.users.map(user => {
				delete user.password;
				return user;
			}),
		});
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
		// Find the user in the database
		const user = Users.findOne({ id: req.params.id });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Remove the password from the response
		delete user.password;

		return res.json({
			success: true,
			message: "User retrieved successfully",
			user,
		});
	})

	// PUT /api/users/:id
	.put(isAuthorized, async (req, res) => {
		// Find the users in the database
		const user = Users.findOne({ id: req.params.id });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Parse the user
		const parsed = parseUsers([
			{
				...req.body,
				id: req.params.id,
				password: new Password(req.body.password),
				metadata: {
					created: user.metadata.created,
					updated: new Date(),
				},
			},
		]);

		if (!parsed.success) {
			return res.status(400).json(parsed);
		}

		// Update the user in the database
		await Users.updateOne({ id: req.params.id }, parsed.users[0]);

		// Remove the password from the response
		delete parsed.users[0].password;

		return res.json({
			success: true,
			message: "User replaced successfully",
			user: parsed.users[0],
		});
	})

	// PATCH /api/users/:id
	.patch(isAuthorized, async (req, res) => {
		// Find the user in the database
		const user = Users.findOne({ id: req.params.id });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Parse the user
		const parsed = parseUsers([
			{
				...user,
				...req.body,
				password: new Password(req.body.password),
				id: req.params.id,
				metadata: {
					created: user.metadata.created,
					updated: new Date(),
				},
			},
		]);

		if (!parsed.success) {
			return res.status(400).json(parsed);
		}

		// Update the user in the database
		await Users.updateOne({ id: req.params.id }, parsed.users[0]);

		// Remove the password from the response
		delete parsed.users[0].password;

		return res.json({
			success: true,
			message: "User updated successfully",
			user: parsed.users[0],
		});
	})

	// DELETE /api/users/:id
	.delete(isAuthorized, async (req, res) => {
		// Find the user in the database
		const user = Users.findOne({ id: req.params.id });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Delete the user from the database
		await Users.deleteOne({ id: req.params.id });

		return res.json({
			success: true,
			message: "User deleted successfully",
		});
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

export default router;
