import { z } from "zod";

export const User = z
	.object({
		// ID must be a string that is a valid UUID
		id: z
			.string({
				message: "ID must be a string",
			})
			.uuid({
				message: "ID must be a valid UUID",
			}),

		// Username must be a string between 3 and 20 characters long and must not contain any special characters
		username: z
			.string({ message: "Username must be a string" })
			.min(3, { message: "Username must be at least 3 characters long" })
			.max(20, { message: "Username must be at most 20 characters long" })
			.regex(/^[a-zA-Z0-9_.-]+$/, { message: "Username must not contain any special characters" }),

		// Store the password as a hash and salt
		password: z.object({
			hash: z.string({ message: "Hash must be a string" }),
			salt: z.string({ message: "Salt must be a string" }),
		}),

		name: z.object({
			// First name must be a string
			first: z.string({ message: "First name must be a string" }),
			// Last name must be a string
			last: z.string({ message: "Last name must be a string" }),
		}),

		// Email must be a valid email address
		email: z
			.string({
				message: "Email must be a string",
			})
			.email({
				message: "Email must be a valid email address",
			})
			.optional(),

		// Avatar must be a string that is a valid URL
		avatar: z
			.string({
				message: "Avatar must be a string",
			})
			.url({
				message: "Avatar must be a valid URL",
			})
			.optional(),

		metadata: z.object({
			// Created timestamp must be a date
			created: z.date({
				message: "Created timestamp must be a date",
			}),
			// Updated timestamp must be a date
			updated: z.date({
				message: "Updated timestamp must be a date",
			}),
		}),
	})
	.strict({ message: "Invalid user" });
