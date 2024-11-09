import 'dotenv/config';
import express from "express";
import cors from "cors";
import process from "process";

import stripeWebhookController from './controllers/stripewebhookcontroller.js';
import emailController from "./controllers/emailcontroller.js";
import healthcheckController from "./controllers/healthcheckcontroller.js";
import openaiController from "./controllers/openaicontroller.js";
import stripeController from "./controllers/stripecontroller.js";

// Initialize Stripe client
let stripeKey = ''
if (process.env.NODE_ENV === 'development') {
  stripeKey = process.env.STRIPE_TEST_SECRET_KEY;
    } else {
  stripeKey = process.env.STRIPE_LIVE_SECRET_KEY;
}

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  }),
);

// webhooks need to be setup before the body parser
app.use('/webhook/stripe', stripeWebhookController);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', stripeController);
app.use('/', emailController);
app.use('/', healthcheckController)
app.use('/', openaiController);

const port = process.env.PORT || 3000;
app.listen(port);
