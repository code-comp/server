import express, { Router } from "express";
import auth, { isAuthenticated } from "./api/auth.mjs";
import users from "./api/users.mjs";

const router = Router();

// Check if the user is authenticated
router.use(isAuthenticated);

// Parse the body of the request
router.use(express.json());

// API endpoints
router.use("/auth", auth);
router.use("/users", users);

export default router;
