import express from "express";
import supabase from '../data/supabase.js';
import {auth, OAuth2Client} from 'google-auth-library';

const router = express.Router();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

const SCOPES = [
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.body.write',
];

let userId = '';

router.get("/api/start-google-oauth", async (req, res) => {

    userId = req.query.userId;
    
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        

        res.status(200).json({ url: authUrl });    
    } catch (error) {
        console.error('Error starting Google OAuth:', error);
        res.status(500).send('Error starting Google OAuth');
    }        
});

router.get("/api/googleoauth", async (req, res) => {
    try {
        const code = req.query.code;
        const { tokens} = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save the refresh token securely
        if (tokens) {
            console.log('Refresh token:', tokens);

            const { error } = await supabase.from("google_tokens").insert({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: tokens.expiry_date,
                token_type: tokens.token_type,
                scope: tokens.scope,
                user_id: userId,
            });
            
            userId = '';

            if (error) {
                console.error('Error saving tokens to the database:', error);
                return res.status(500).send('Error saving tokens to the database');
            }
        }

        res.status(200).redirect(process.env.VITE_REDIRECT_URL);
    } catch (error) {
        console.error('Error during token exchange:', error);
        res.status(500).send('Authentication failed.');
    }
});

export default router;