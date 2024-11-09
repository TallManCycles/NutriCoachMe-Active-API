import express from 'express';
import Stripe from 'stripe';
import process from 'process';
import authenticate from "./authenticationcontroller.js";
import {logError, logInfo} from "../error/log.js";

const router = express.Router();

// Initialize Stripe client
let stripeKey = '';

if (process.env.NODE_ENV === 'development') {
    console.log('Development mode');
    stripeKey = process.env.STRIPE_TEST_SECRET_KEY;
} else {
    stripeKey = process.env.STRIPE_LIVE_SECRET_KEY;
}

const stripe = new Stripe(stripeKey);

/**
 * @param {Object} request
 * @param {Object} response
 * Returns a customerid from a session id
 * @returns {Object} response
 * @throws {Error} error
 * @example
 */
router.get('/api/stripe/customer',async (req, response) => {

    const sessionId = req.query.session;

    if (!sessionId) {
        response.status(400).end();
        return;
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(
            sessionId
        );
        
        logInfo(JSON.stringify(session));

        const customer = session.customer;

        if (!customer) {
            response.status(404).end();
            return;
        }

        response.status(200).json({customer});
    } catch (error) {
        logError(error);
        response.status(404).end();
    }
});

export default router;