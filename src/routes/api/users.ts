import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { parseUsers, Password, Users } from "../../data/database.js";

const router = Router();

// Users endpoint
router
	.route("/")

	// GET /api/users (admin only)
	.get(async (req: Request, res: Response) => {
		// Find all users
		const users = await Users.find({}).toArray();

		// Check if this user is an admin
		if ((await Users.findOne({ id: req.user?.id }))?.["roles"].includes("admin")) {
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
				delete user["password"];
				return user;
			}),
		});
	})

	// POST /api/users
	.post(async (req: Request, res: Response) => {
		const users = req.body;

		if (!Array.isArray(users)) {
			return res.status(400).json({
				success: false,
				message: "Invalid request",
			});
		}

		// Parse the users
		const parsed = await parseUsers(
			users.map(user => ({
				...user,
				id: crypto.randomUUID(),
				password: new Password(user.password).result,
				metadata: {
					created: new Date(),
					updated: new Date(),
				},
			}))
		);

		if (!parsed.success || !parsed.users) {
			return res.status(400).json(parsed);
		}

		// Insert the users into the database
		await Users.insertMany(parsed.users);

		// Remove passwords from the response
		return res.status(201).json({
			success: true,
			message: "Users created successfully",
			users: parsed.users?.map(user => {
				// @ts-expect-error
				delete user.password;
				return user;
			}),
		});
	})

	// OPTIONS /api/users
	.options(async (_req: Request, res: Response) => {
		// Allow CORS preflight
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Methods", "POST");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		res.set("Access-Control-Max-Age", "3600");
		res.set("Allow", "GET, POST");
		res.status(204).end();
	})

	// All other methods
	.all(async (_req: Request, res: Response) => {
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
	.get(isAuthorized, async (req: Request, res: Response) => {
		// Find the user in the database
		const user = await Users.findOne({ id: req.params["id"] });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Remove the password from the response
		delete user["password"];

		return res.json({
			success: true,
			message: "User retrieved successfully",
			user,
		});
	})

	// PUT /api/users/:id
	.put(isAuthorized, async (req: Request, res: Response) => {
		// Find the users in the database
		const user = await Users.findOne({ id: req.params["id"] });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Parse the user
		const parsed = await parseUsers([
			{
				...req.body,
				id: req.params["id"],
				password: new Password(req.body.password).result,
				metadata: {
					created: user["metadata"].created,
					updated: new Date(),
				},
			},
		]);

		if (!parsed.success || !parsed.users?.[0]) {
			return res.status(400).json(parsed);
		}

		// Update the user in the database
		await Users.updateOne({ id: req.params["id"] }, parsed.users[0]);

		// Remove the password from the response
		// @ts-expect-error
		delete parsed.users[0].password;

		return res.json({
			success: true,
			message: "User replaced successfully",
			user: parsed.users[0],
		});
	})

	// PATCH /api/users/:id
	.patch(isAuthorized, async (req: Request, res: Response) => {
		// Find the user in the database
		const user = await Users.findOne({ id: req.params["id"] });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Parse the user
		const parsed = await parseUsers([
			{
				...user,
				...req.body,
				password: new Password(req.body.password).result,
				id: req.params["id"],
				metadata: {
					created: user["metadata"].created,
					updated: new Date(),
				},
			},
		]);

		if (!parsed.success || !parsed.users?.[0]) {
			return res.status(400).json(parsed);
		}

		// Update the user in the database
		await Users.updateOne({ id: req.params["id"] }, parsed.users[0]);

		// Remove the password from the response
		// @ts-expect-error
		delete parsed.users[0].password;

		return res.json({
			success: true,
			message: "User updated successfully",
			user: parsed.users[0],
		});
	})

	// DELETE /api/users/:id
	.delete(isAuthorized, async (req: Request, res: Response) => {
		// Find the user in the database
		const user = await Users.findOne({ id: req.params["id"] });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Delete the user from the database
		await Users.deleteOne({ id: req.params["id"] });

		return res.json({
			success: true,
			message: "User deleted successfully",
		});
	})

	// OPTIONS /api/users/:id
	.options(async (_req: Request, res: Response) => {
		// Allow CORS preflight
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Methods", "POST");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		res.set("Access-Control-Max-Age", "3600");
		res.set("Allow", "GET, PUT, PATCH, DELETE");
		res.status(204).end();
	})

	// All other methods
	.all(async (_req: Request, res: Response) => {
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
function isAuthorized(req: Request, res: Response, next: NextFunction) {
	if (req.user?.id !== req.params["id"]) {
		console.log(req.user, req.params["id"]);
		res.status(403).json({
			success: false,
			message: "Forbidden",
		});
	} else {
		next();
	}
}

export default router;
