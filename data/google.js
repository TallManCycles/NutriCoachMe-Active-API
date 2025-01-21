import axios from 'axios';
import supabase from "./supabase.js";
import {OAuth2Client} from "google-auth-library";
import {formatDate} from "../utils/dateUtils.js";


async function getBiometricsFromGoogle() {
    // for each google token in the database, fetch the biometrics data        
    const { data: googleTokens, error: fetchError } = await supabase
        .from('access_tokens')
        .select()
        .eq('type', 'google');
    
    if (fetchError) {
        console.error('Error fetching google tokens:', fetchError);
        return;
    }
    
    for (const token of googleTokens) {
        
        const googleToken = {            
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expiry_date: token.expires_in,
            token_type: token.token_type,
            scope: token.scope
        }

        const client = await getGoogleOAuthClient(token.user_id, googleToken);

        const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
        
        const headers = {
            'Authorization': `Bearer ${client.credentials.access_token}`,
            'Content-Type': 'application/json'
        };
        const requestBody = {
            // make this 7 days of data
            "startTimeMillis": Date.now() - 604800000,
            "endTimeMillis": Date.now(),
            "aggregateBy": [
                {
                    "dataTypeName": "com.google.weight"
                }
            ],
            "bucketByTime": {
                "durationMillis": 86400000 // 1 day
            }
        };

        try {
            const response = await axios.post(url, requestBody, {headers});
            const fitnessData = response.data;

            let items = [];

            // Log out the weight data
            fitnessData.bucket.forEach(bucket => {
                const weightData = bucket.dataset[0].point;
                if (weightData.length > 0) {
                    weightData.forEach(point => {
                        items.push({
                            date: new Date(point.startTimeNanos / 1000000),
                            weight: point.value[0].fpVal?.toFixed(2),
                            notes: 'weight added from google fit'
                        });
                    });
                }
            });

            if (items.length > 0) {

                if (items.length > 0) {
                    for (const data of items) {
                        const {data: existingRow, error: fetchError} = await supabase
                            .from("usermetrics")
                            .select()
                            .eq("userid", token.user_id)
                            .eq("date", formatDate(data.date))

                        if (fetchError) {
                            console.error('Error fetching existing row:', fetchError);
                            continue;
                        }

                        if (existingRow.length > 0) {
                            const {error: updateError} = await supabase
                                .from("usermetrics")
                                .update({
                                    weight: parseFloat(data.weight),
                                    notes: existingRow[0].notes + ', ' + data.notes,
                                    complete: true
                                })
                                .eq('id', existingRow[0].id);

                            if (updateError) {
                                console.error('Error updating row:', updateError);
                            }
                        } else {
                            const {error: insertError} = await supabase
                                .from("usermetrics")
                                .insert({
                                    userid: token.user_id,
                                    date: formatDate(data.date),
                                    weight: parseFloat(data.weight),
                                    notes: data.notes,
                                    complete: true
                                });

                            if (insertError) {
                                console.error('Error inserting new row:', insertError);
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching fitness data:', error);
        } finally {
            this.isLoading = false;
        }
    }
}


/**
 * @typedef {Object} Token
 * @property {string|null} [refresh_token] - The refresh token.
 * @property {number|null} [expiry_date] - The expiry date of the token.
 * @property {string|null} [access_token] - The access token.
 * @property {string|null} [token_type] - The type of the token.
 * @property {string|null} [id_token] - The ID token.
 * @property {string|null} [scope] - The scope of the token.
 */

/**
 * Get an OAuth2Client for Google
 * @param {string} userId - The user ID.
 * @param {Token} token - The token object.
 * @returns {Promise<OAuth2Client>}
 */
async function getGoogleOAuthClient(userId, token) {

    // Create OAuth2 client
    const oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL);
    
    oAuth2Client.setCredentials(token);

    // Listen for token updates to save them
    oAuth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await supabase
                .from('access_tokens')
                .update({
                    refresh_token: tokens.refresh_token,
                    expiry_date: tokens.expiry_date,
                    access_token: tokens.access_token
                })
                .eq('user_id', userId);
        } else {
            await supabase
                .from('access_tokens')
                .update({
                    expiry_date: tokens.expiry_date,
                    access_token: tokens.access_token
                })
                .eq('user_id', userId);
        }
    });

    return oAuth2Client;
}

export {getBiometricsFromGoogle};