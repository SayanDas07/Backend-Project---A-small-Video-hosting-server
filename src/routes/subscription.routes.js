import { Router } from 'express';
import {
    
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
//router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/c/:channelId").get(verifyJWT,getUserChannelSubscribers);

router.route("/u/:subscriberId").get(verifyJWT, getSubscribedChannels);

router.route("/c/:channelId").post(verifyJWT, toggleSubscription)

export default router