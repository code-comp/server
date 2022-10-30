import type { Request, Response } from "express";
import express, { Router } from "express";
import auth, { isAuthenticated } from "./api/auth.js";
import users from "./api/users.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Welcome to the API",
    });
});

// Check if the user is authenticated
router.use(isAuthenticated);

// Parse the body of the request
router.use(express.json());

// API endpoints
router.use("/auth", auth);
router.use("/users", users);

export default router;
