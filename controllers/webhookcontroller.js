import express from "express";
import supabase from '../data/supabase.js';

const router = express.Router();

router.post("/webhook/garmin-body-composition", async (req, res) => {
    try {
        const bodyCompositionData = req.body.bodyComps;

        saveUserDataInDatabase(bodyCompositionData);
        
        res.status(200).send('Data processed successfully');
    } catch (error) {
        console.error('Error processing Garmin data:', error);
        res.status(500).send('Internal Server Error');
    }     
});

async function saveUserDataInDatabase(compositionData) {
    const promises = compositionData.map(async (comp) => {
        const { data: user, error } = await supabase
            .from('access_tokens')
            .select('user_id')
            .eq('access_token', comp.userAccessToken)
            .eq('type', 'garmin');

        if (!user || error) {
            console.error('Error getting user from access token:', error);
            return;
        }

        const userId = user[0].user_id;
        const utcDateTime = new Date(comp.measurementTimeInSeconds * 1000);
        const localDateTime = new Date(utcDateTime.getTime() + 10 * 60 * 60 * 1000);
        const dbDate = localDateTime.toISOString().split('T')[0];
        
        // get the uuid from the users table to insert into the usermetrics table
        
        const { data: userUuid, error: userUuidError } = await supabase
            .from('users')
            .select('uuid')
            .eq('id', userId);
        
        if (userUuidError || !userUuid || userUuid.length === 0) {
            console.error('Error getting user uuid:', userUuidError);
            return;
        }

        // check if there is already a weight entry for this date, and if so upsert it with onconflict = id
        const { data: existingData, error: existingError } = await supabase
            .from('usermetrics')
            .select()
            .eq('date', dbDate)
            .eq('userid', userId);

        if (existingError) {
            console.error('Error getting existing weight data:', existingError);
            return;
        }

        if (existingData.length > 0) {
            
            if (existingData[0].external_update) {
                console.log('Skipping external update');
                return;
            }
            
            const { error: updateError } = await supabase
                .from('usermetrics')
                .upsert({
                    id: existingData[0].id,
                    userid: userId,
                    uuid: userUuid[0].uuid,
                    weight: comp.weightInGrams / 1000,
                    date: dbDate,
                    external_update: true,
                    json_data: comp
                });

            if (updateError) {
                console.error('Error updating weight data:', updateError);
            }
        } else {
            const { error: insertError } = await supabase
                .from('usermetrics')
                .insert({
                    userid: userId,
                    uuid: userUuid[0].uuid,
                    weight: comp.weightInGrams / 1000,
                    date: dbDate,
                    external_update: true,
                    json_data: comp
                });

            if (insertError) {
                console.error('Error inserting weight data:', insertError);
            }
        }
    });

    // Wait for all promises to complete
    await Promise.all(promises);
}


export default router;