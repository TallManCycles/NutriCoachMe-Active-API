import jwt from "jsonwebtoken";
import process from "process";
import {logError} from "../error/log.js";

const authenticate = async (req, res, next) => {

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        req.user = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
        next();
    } catch (error) {
        logError(error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

export default authenticate;