import jwt from "jsonwebtoken";
import process from "process";
import supabase from '../data/supabase.js';
import { logError } from "../error/log.js";

const authenticate = async (req, res, next) => {

    const token = req.headers.authorization?.split(' ')[1];
    
    let secret = process.env.SUPABASE_JWT_SECRET;
    
    if (process.env.NODE_ENV === 'development') {
        secret = process.env.SUPABASE_TEST_JWT_SECRET;
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        req.user = jwt.verify(token,secret);
        next();
    } catch (error) {
        logError(error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

const authorisedUser = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select()
            .eq('uuid', req.user.sub)
            .single();

        if (error) {
            logError(error);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.authorisedUser = user;
        next();
    } catch (error) {
        logError(error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

export { authenticate, authorisedUser };