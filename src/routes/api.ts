import type { Request, Response, NextFunction } from "express";
import express, { Router } from "express";
import auth, { isAuthenticated } from "./api/auth.js";
import users from "./api/users.js";

const router = Router();

// GET /api
router.get("/", (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Welcome to the API",
    });
});

// OPTIONS /* (CORS)
router.options("*", (_req: Request, res: Response) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).end();
});

// CORS middleware
router.use((_req: Request, res: Response, next: NextFunction) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    next();
});

// Check if the user is authenticated
router.use(isAuthenticated);

// Parse the body of the request
router.use(express.json());

// API endpoints
router.use("/auth", auth);
router.use("/users", users);

export default router;
