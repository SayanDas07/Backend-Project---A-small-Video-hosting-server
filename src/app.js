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


//router import
import userRouter from "./routes/user.routes.js";

//declare routes


//app.use("/user", userRouter);
//standard practice is :
app.use("/api/v1/users", userRouter);

// http://localhost:8000/api/v1/users/register  register is the route






export { app };