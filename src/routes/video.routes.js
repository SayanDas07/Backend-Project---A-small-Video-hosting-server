import { Router } from 'express';
import {
    publishAVideo
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
//import { verify } from 'jsonwebtoken';

const router = Router();
//router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/upload-Video").post(verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

export default router