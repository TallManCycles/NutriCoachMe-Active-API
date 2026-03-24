import express from "express";
import supabase from '../data/supabase.js';
import {auth, OAuth2Client} from 'google-auth-library';
import {OAuth} from 'oauth';
import { authenticate, authorisedUser } from "./authenticationcontroller.js";

const router = express.Router();

export const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

const SCOPES = [
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.body.write',
];

const requestTokenUrl = process.env.REQUEST_TOKEN_URL;
const accessTokenUrl = process.env.ACCESS_TOKEN_URL;
const authorizeUrl = process.env.AUTHORIZE_URL;
const consumerKey = process.env.GARMIN_CONSUMER_KEY;
const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

export const oauth = new OAuth(
    requestTokenUrl,
    accessTokenUrl,
    consumerKey,
    consumerSecret,
    '1.0',
    'https://test-apit.aaroseday.com.au/api/garmin-callback',
    'HMAC-SHA1',
    null,
    {
        Accept: '*/*',
        Connection: 'close',
        'User-Agent': 'Node authentication',
    }
);

let userId = '';

let garminTokenId = '';

export const handleStartGoogleOAuth = async (req, res) => {
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
};

export const handleGoogleOAuth = async (req, res) => {
    try {
        const code = req.query.code;
        const { tokens} = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save the refresh token securely
        if (tokens) {
            console.log('Refresh token:', tokens);

            const { error } = await supabase.from("access_tokens").insert({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date,
                token_type: tokens.token_type,
                scope: tokens.scope,
                user_id: userId,
                type: 'google'
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
};

export const handleRequestGarminToken = async (req, res) => {
    try {
        userId = req.authorisedUser.id;
        
        const { oauthToken, oauthTokenSecret } = await new Promise((resolve, reject) => {
            oauth.getOAuthRequestToken((err, oauthToken, oauthTokenSecret) => {
                if (err) reject(err);
                else resolve({ oauthToken, oauthTokenSecret });
            });
        });

        const {data, error} = await supabase
            .from("oauth_tokens")
            .insert({
                oauth_token: oauthToken,
                oauth_token_secret: oauthTokenSecret,
                user_id: userId,
                type: 'garmin'
            })
            .select();

        if (error) {
            console.error('Error saving Garmin OAuth token:', error);
            return res.status(500).send('Failed to save Garmin OAuth token');
        }

        garminTokenId = data[0].id;

        res.status(200).send({url: `${authorizeUrl}?oauth_token=${oauthToken}`});
    } catch (error) {
        console.error('Error requesting Garmin token:', error);
        res.status(500).send('Failed to obtain request token');
    }
};

export const handleGarminCallback = async (req, res) => {
    try {
        const {oauth_token, oauth_verifier} = req.query;

        const {data, error} = await supabase.from("oauth_tokens").select().eq('id', garminTokenId);

        if (error || !data || data.length === 0) {
            console.error('Error retrieving request token secret:', error);
            return res.status(500).send('Failed to retrieve request token secret');
        }

        // Retrieve stored request token secret
        const oauthTokenSecret = data[0].oauth_token_secret;

        const { accessToken, accessTokenSecret } = await new Promise((resolve, reject) => {
            oauth.getOAuthAccessToken(
                oauth_token,
                oauthTokenSecret,
                oauth_verifier,
                (err, accessToken, accessTokenSecret) => {
                    if (err) reject(err);
                    else resolve({ accessToken, accessTokenSecret });
                }
            );
        });

        const {error: saveError} = await supabase.from("access_tokens").insert({
            access_token: accessToken,
            user_id: userId,
            type: 'garmin'
        });
        
        if (saveError) {
            console.error('Error saving Garmin access token:', saveError);
            return res.status(500).send('Failed to save Garmin access token');
        }

        userId = '';

        res.status(200).redirect(process.env.VITE_REDIRECT_URL);
    } catch (error) {
        console.error('Error during Garmin callback:', error);
        res.status(500).send('Authentication failed during callback');
    }
};

router.get("/api/start-google-oauth", handleStartGoogleOAuth);
router.get("/api/googleoauth", handleGoogleOAuth);
router.get("/api/request-garmin-token", authenticate, authorisedUser, handleRequestGarminToken);
router.get('/api/garmin-callback', handleGarminCallback);

export default router;