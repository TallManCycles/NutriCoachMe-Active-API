import axios from 'axios';
import supabase from "./supabase.js";
import { OAuth2Client } from "google-auth-library";
import { formatDate } from "../utils/dateUtils.js";

async function getBiometricsFromGoogle() {
    const { data: googleTokens, error: fetchError } = await supabase
        .from('access_tokens')
        .select()
        .eq('type', 'google');

    if (fetchError) {
        console.error('Error fetching google tokens:', fetchError);
        return;
    }

    for (const token of googleTokens) {
        try {
            console.log('Processing token for user:', token.user_id);
            
            const googleToken = {
                access_token: token.access_token,
                refresh_token: token.refresh_token,
                expiry_date: token.expiry_date,
                token_type: token.token_type,
                scope: token.scope
            };

            console.log('Token expiry date:', new Date(googleToken.expiry_date));
            
            const client = await getGoogleOAuthClient(token.user_id, googleToken);

            const { data: userUuid, error: userUuidError } = await supabase
                .from('users')
                .select('uuid')
                .eq('id', token.user_id);

            if (userUuidError || !userUuid || userUuid.length === 0) {
                console.error('Error getting user uuid:', userUuidError);
                continue;
            }

            const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
            const headers = {
                'Authorization': `Bearer ${client.credentials.access_token}`,
                'Content-Type': 'application/json'
            };
            const requestBody = {
                "startTimeMillis": Date.now() - 604800000,
                "endTimeMillis": Date.now(),
                "aggregateBy": [{ "dataTypeName": "com.google.weight" }],
                "bucketByTime": { "durationMillis": 86400000 }
            };

            try {
                console.log('Fetching fitness data for user:', token.user_id);
                const response = await axios.post(url, requestBody, { headers });
                const fitnessData = response.data;

                if (!fitnessData.bucket) {
                    console.log('No fitness data found for user:', token.user_id);
                    continue;
                }

                const items = fitnessData.bucket.flatMap(bucket =>
                    bucket.dataset[0].point.map(point => ({
                        date: new Date(point.startTimeNanos / 1000000),
                        weight: point.value[0].fpVal?.toFixed(2),
                        notes: 'weight added from google fit'
                    }))
                );

                console.log(`Found ${items.length} weight entries for user:`, token.user_id);

                for (const data of items) {
                    const { data: existingRow, error: fetchError } = await supabase
                        .from("usermetrics")
                        .select()
                        .eq("userid", token.user_id)
                        .eq("date", formatDate(data.date));

                    if (fetchError) {
                        console.error('Error fetching existing row:', fetchError);
                        continue;
                    }

                    if (existingRow.length > 0) {
                        if (existingRow[0].external_update) continue;

                        const { error: updateError } = await supabase
                            .from("usermetrics")
                            .update({
                                weight: parseFloat(data.weight),
                                notes: `${existingRow[0].notes}, ${data.notes}`,
                                complete: true,
                                external_update: true,
                                json_data: data,
                                uuid: userUuid[0].uuid
                            })
                            .eq('id', existingRow[0].id);

                        if (updateError) {
                            console.error('Error updating row:', updateError);
                        }
                    } else {
                        const { error: insertError } = await supabase
                            .from("usermetrics")
                            .insert({
                                userid: token.user_id,
                                date: formatDate(data.date),
                                weight: parseFloat(data.weight),
                                notes: data.notes,
                                complete: true,
                                external_update: true,
                                json_data: data,
                                uuid: userUuid[0].uuid
                            });

                        if (insertError) {
                            console.error('Error inserting new row:', insertError);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching fitness data for user:', token.user_id, error.response?.status, error.response?.statusText);
                if (error.response?.data?.error) {
                    console.error('Google API error details:', error.response.data.error);
                }
            }
        } catch (error) {
            console.error('Error processing token for user:', token.user_id, error);
        } finally {
            console.log('Finished processing Google Fit data for user:', token.user_id, 'at', new Date().toISOString());
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
    const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    if (!token.access_token) {
        throw new Error('No access token available');
    }

    oAuth2Client.setCredentials(token);

    // Check if token is expired or will expire in the next 5 minutes
    const expiryDate = token.expiry_date;
    const isExpired = expiryDate ? Date.now() >= (expiryDate - 300000) : true;

    if (isExpired) {
        if (!token.refresh_token) {
            // If no refresh token, we need to re-authenticate
            console.error('No refresh token available for user:', userId);
            
            // Delete the invalid token
            await supabase
                .from('access_tokens')
                .delete()
                .eq('user_id', userId)
                .eq('type', 'google');
                
            throw new Error('No refresh token available. User needs to re-authenticate.');
        }

        try {
            console.log('Token expired, attempting refresh for user:', userId);
            const { credentials } = await oAuth2Client.refreshAccessToken();
            
            // Ensure we got new credentials
            if (!credentials.access_token) {
                throw new Error('Failed to get new access token');
            }

            const updateData = {
                access_token: credentials.access_token,
                expiry_date: credentials.expiry_date,
            };
            
            if (credentials.refresh_token) {
                updateData.refresh_token = credentials.refresh_token;
            }

            const { error: updateError } = await supabase
                .from('access_tokens')
                .update(updateData)
                .eq('user_id', userId)
                .eq('type', 'google');

            if (updateError) {
                console.error('Error updating tokens in database:', updateError);
                throw updateError;
            }

            console.log('Successfully refreshed token for user:', userId);
            oAuth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Error refreshing token:', error);
            
            // If refresh failed, delete the token and require re-authentication
            await supabase
                .from('access_tokens')
                .delete()
                .eq('user_id', userId)
                .eq('type', 'google');
                
            throw new Error('Token refresh failed. User needs to re-authenticate.');
        }
    }

    oAuth2Client.on('tokens', async (tokens) => {
        if (!tokens.access_token) return;
        
        const updateData = {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date
        };
        
        if (tokens.refresh_token) {
            updateData.refresh_token = tokens.refresh_token;
        }
        
        const { error: updateError } = await supabase
            .from('access_tokens')
            .update(updateData)
            .eq('user_id', userId)
            .eq('type', 'google');

        if (updateError) {
            console.error('Error updating tokens in database:', updateError);
        }
    });

    return oAuth2Client;
}

export { getBiometricsFromGoogle };