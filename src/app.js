import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import e from "express";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // allow to server to accept request from different origin
    credentials: true       // to allow cookies from the front-end
}));

app.use(express.json({ limit: "10kb" }));  // body-parser

app.use(express.urlencoded({ extended: true, limit: "10kb" }));  
app.use(express.static("public"));

app.use(cookieParser()); // parse cookies
//cookie parser is a middle ware that parses cookies attached to the client request object


//router import
import userRouter from "./routes/user.routes.js";

//declare routes


//app.use("/user", userRouter);
//standard practice is :
app.use("/api/v1/users", userRouter);

// http://localhost:8000/api/v1/users/register  register is the route

import subsRouter from "./routes/subscription.routes.js";
app.use("/api/v1/subscribers", subsRouter);
// http://localhost:8000/api/v1/subscribers


import tweetRouter from "./routes/tweet.routes.js";
app.use("/api/v1/tweets", tweetRouter);
// http://localhost:8000/api/v1/tweets/



export { app };