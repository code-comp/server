import type { UserSchema } from "./data/schema.js";

// Merge a user ID into the request object
declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
            };
        }
    }
}
