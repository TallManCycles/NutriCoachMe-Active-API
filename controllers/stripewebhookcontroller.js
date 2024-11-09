import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import process from 'process';
import {logError, logInfo} from "../error/log.js";

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVCE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe client
let stripeKey = '';
if (process.env.NODE_ENV === 'development') {
    stripeKey = process.env.STRIPE_TEST_SECRET_KEY;
} else {
    stripeKey = process.env.STRIPE_LIVE_SECRET_KEY;
}

const stripe = new Stripe(stripeKey);

router.post('/', express.raw({ type: 'application/json' }), async (request, response) => {
    const sig = request.headers['stripe-signature'];
    const endpointSecret = 'whsec_xqV8kA1LmJY2mexn5TMgkq4OKtJC2Vr7';

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        logError(err);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    let result = null;

    // Handle the event
    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.deleted':
        case 'customer.subscription.paused':
        case 'customer.subscription.resumed':
        case 'customer.subscription.updated':
        case 'subscription_schedule.aborted':
        case 'subscription_schedule.canceled':
        case 'subscription_schedule.completed':
        case 'subscription_schedule.created':
        case 'subscription_schedule.expiring':
        case 'subscription_schedule.released':
        case 'subscription_schedule.updated':
            result = await handleWebhookRequest(event.id, event.type, event.data.object);
            break;
        default:
            response.status(400).end();
            logError(`Unhandled event type ${event.type}`);
    }

    if (!result) {
        response.status(500).end();
    }

    response.send();
});

router.post('/stripe/customer')

async function handleWebhookRequest(id, eventType, data) {
    logInfo(`Received event ${eventType} with id ${id}`);

    try {
        const customerId = data ? data.customer : null;

        // insert the data into the webhook_data table in supabase
        const { error } = await supabase
            .from('webhook_data')
            .insert({
                webhook_id: id,
                event_type: eventType,
                customer_id: customerId,
                data: data
            });

        if (error) {
            logError(error);
            return false;
        }
        
        // insert the active until date into the users table in supabase        
        // get the user id from the customer id

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();        
        
        if (userError) {
            logError(userError);
            return false;
        }
        
        const timestamp = data.current_period_end;
        if (timestamp) {
            const activeUntil = new Date(timestamp * 1000);

            const { error: subscriptionError } = await supabase
                .from('users')
                .update({
                    active_until: activeUntil.toISOString()
                })
                .eq('id', user.id);

            if (subscriptionError) {
                logError(subscriptionError);
                return false;
            }
        } else {
            logError('No current_period_end in subscription data');
            return false;
        }
           
        
    } catch (error) {
        logError(error);
        return false;
    }

    return true;
}

export default router;