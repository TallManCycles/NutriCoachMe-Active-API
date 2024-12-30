import express from 'express';
import supabase from '../data/supabase.js';
import { logError } from '../error/log.js';

const router = express.Router();

router.post('/api/weight-tracker', async (req, res) => {
    try {
        const { ping } = req.body;

        if (ping !== 1) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Fetch the current value and count
        const { data: currentData, error: fetchError } = await supabase
            .from('interest')
            .select('*');

        if (fetchError) {
            throw fetchError;
        }
        
        if (!currentData || currentData.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        const { count, value } = currentData[0];
        const newCount = count + 1;
        const newValue = value + 4;

        // Upsert the updated values
        const { data, error } = await supabase
            .from('interest')
            .upsert({
                id: 1,
                count: newCount,
                value: newValue
            }, { onConflict: 'id' });

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Interest count and value incremented' });
    } catch (error) {
        logError(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

export default router;