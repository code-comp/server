import dotenv from "dotenv";
import express from "express";
import api from "./routes/api.mjs";
dotenv.config();
const app = express();
const port = 8080;

// Serve API routes
app.use("/api", api);

// Start the server
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
