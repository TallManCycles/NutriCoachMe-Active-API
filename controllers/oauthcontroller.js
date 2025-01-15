import express from "express";
import supabase from '../data/supabase.js';
import {auth, OAuth2Client} from 'google-auth-library';
import {OAuth} from 'oauth';
import { authenticate, authorisedUser } from "./authenticationcontroller.js";

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

const requestTokenUrl = process.env.REQUEST_TOKEN_URL;
const accessTokenUrl = process.env.ACCESS_TOKEN_URL;
const authorizeUrl = process.env.AUTHORIZE_URL;
const consumerKey = process.env.GARMIN_CONSUMER_KEY;
const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

const oauth = new OAuth(
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

            const { error } = await supabase.from("access_tokens").insert({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: tokens.expiry_date,
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
});


router.get("/api/request-garmin-token", authenticate, authorisedUser,  async (req, res) => {
    try {
        
    userId = req.authorisedUser.id;
        
    oauth.getOAuthRequestToken(async (err, oauthToken, oauthTokenSecret) => {
        if (err) {
            console.error('Error getting OAuth request token:', err);
            return res.status(500).send('Failed to obtain request token');
        }

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
    });
    } catch (error) {
        console.error('Error requesting Garmin token:', error);
    }
});

router.get('/api/garmin-callback', async (req, res) => {

    try {

        const {oauth_token, oauth_verifier} = req.query;

        const {data, error} = await supabase.from("oauth_tokens").select().eq('id', garminTokenId);

        // Retrieve stored request token secret
        const oauthTokenSecret = data[0].oauth_token_secret;

        oauth.getOAuthAccessToken(
            oauth_token,
            oauthTokenSecret,
            oauth_verifier,
            async (err, accessToken, accessTokenSecret) => {
                if (err) {
                    console.error('Error getting OAuth access token:', err);
                    return res.status(500).send('Failed to obtain access token');
                }

                const {error} = await supabase.from("access_tokens").insert({
                    access_token: accessToken,
                    user_id: userId,
                    type: 'garmin'
                });
                
                if (error) {
                    console.error('Error saving Garmin access token:', error);
                    return res.status(500).send('Failed to save Garmin access token');
                }

                userId = '';

                res.status(200).redirect(process.env.VITE_REDIRECT_URL);
            }
        );
    } catch (error) {
        console.error('Error during Garmin callback:', error);
    }
});

export default router;