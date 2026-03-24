import express from "express";

export const getRoot = (req, res) => {
    return res.send("Server is running!");
};

export const getHealthCheck = (req, res) => {
    return res.status(200).json({ message: "Server is healthy! Date: " + new Date().toLocaleString() });
};

const router = express.Router();
router.get("/api/", getRoot);
router.get("/api/health-check", getHealthCheck);

export default router;