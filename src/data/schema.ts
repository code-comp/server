import { z } from "zod";

const VALID_ROLES = ["admin"] as const;

export const UserSchema = z
	.object({
		// ID must be a string that is a valid UUID
		id: z
			.string({
				invalid_type_error: "ID must be a string",
				required_error: "ID is required",
			})
			.uuid({
				message: "ID must be a valid UUID",
			}),

		// A set of roles that the user has
		roles: z
			.set(
				z.string({
					invalid_type_error: "Roles must be strings",
				}).optional(),
			)
			.default(new Set()).refine(
				// Role cannot be admin and it must be a valid role
				roles => !roles.has("admin") && Array.from(roles).every((role)=> VALID_ROLES.includes(role as typeof VALID_ROLES[number])),
				{
					message: "Admin role cannot be assigned to a user",
				}
			),

		// Username must be a string between 3 and 20 characters long and must not contain any special characters
		username: z
			.string({
				invalid_type_error: "Username must be a string",
				required_error: "Username is required",
			})
			.min(3, { message: "Username must be at least 3 characters long" })
			.max(20, { message: "Username must be at most 20 characters long" })
			.regex(/^[a-zA-Z0-9_.-]+$/, { message: "Username must not contain any special characters" }),

		// Store the password as a hash and salt
		password: z.object({
			hash: z.string({
				invalid_type_error: "Password hash must be a string",
				required_error: "Password hash is required",
			}),
			salt: z.string({
				invalid_type_error: "Password salt must be a string",
				required_error: "Password salt is required",
			}),
		}),

		name: z.object({
			// First name must be a string
			first: z.string({
				invalid_type_error: "First name must be a string",
				required_error: "First name is required",
			}),
			// Last name must be a string
			last: z.string({
				invalid_type_error: "Last name must be a string",
				required_error: "Last name is required",
			}),
		}),

		// Email must be a valid email address
		email: z
			.string({
				invalid_type_error: "Email must be a string",
				required_error: "Email is required",
			})
			.email({
				message: "Email must be a valid email address",
			})
			.optional(),

		// Avatar must be a string that is a valid URL
		avatar: z
			.string({
				invalid_type_error: "Avatar must be a string",
				required_error: "Avatar is required",
			})
			.url({
				message: "Avatar must be a valid URL",
			})
			.optional(),

		metadata: z.object({
			// Created timestamp must be a date
			created: z.date({
				invalid_type_error: "Created timestamp must be a date",
				required_error: "Created timestamp is required",
			}),
			// Updated timestamp must be a date
			updated: z.date({
				invalid_type_error: "Updated timestamp must be a date",
				required_error: "Updated timestamp is required",
			}),
		}),
	});

export const PasswordSchema = z
	.string({
		invalid_type_error: "Password must be a string",
		required_error: "Password is required",
	})
	.min(8, { message: "Password must be at least 8 characters long" })
	.max(32, { message: "Password must be at most 32 characters long" })
	.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
	.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
	.regex(/[0-9]/, { message: "Password must contain at least one number" })
	.regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" });

export type UserSchema = z.infer<typeof UserSchema>;
