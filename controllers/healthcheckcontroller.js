import express from "express";

const router = express.Router();
router.get("/api/", (req, res) => {
    res.send("Server is running!");
});

router.get("/api/health-check", (req, res) => {
    return res.status(200).json({ message: "Server is healthy! Date: " + new Date().toLocaleString() });
});

export default router;