import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


// const getAllVideos = asyncHandler(async (req, res) => {
//     //Steps:
//     //1. Get the query params
//     //2. check for query params i.e through which can seach from the videos if video is not published then it should not be shown
//     //3. check for the sort params
//     //4. check for the pagination params
//     //5. get the videos
//     //6. return the response
//     //7. handle the errors


//     //1. Get the query params
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

//     //2. check for query params i.e through which can seach from the videos if video is not published then it should not be shown
//     const video = await Video.aggregate([

//     ])
    

    
// })



const publishAVideo = asyncHandler(async (req, res) => {
    //Steps:
    //1. Get the video details from the request body
    //2. get the video file from the request body
    //3. upload the video file to cloudinary
    //4. create the video
    //5. return the response
    //6. handle the errors

    //1. Get the video details from the request body
    const { title, description} = req.body
    if([title, description].some((field) => field?.trim() === "")){
        throw new ApiError(401,"Title is Required")
    }
    const videoFilePath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    //2. get the video file from the request body
    if(!videoFilePath) {
        throw new ApiError(400, "Please provide the video file")
    }
    if (!thumbnailPath) {
        throw new ApiError(400, "Please provide the thumbnail")
        
    }

    //3. upload the video file to cloudinary
    const videoUrl = await uploadOnCloudinary(videoFilePath)
    const thumbnailUrl = await uploadOnCloudinary(thumbnailPath)
    if (!videoUrl) {
        throw new ApiError(400, "Failed to upload the video file")
        
    }
    if (!thumbnailUrl) {
        throw new ApiError(400, "Failed to upload the thumbnail")
        
    }

    //4. create the video
    const video = await Video.create({
        title,
        description,
        videoFile : videoUrl.url,
        thumbnail : thumbnailUrl.url,
        owner : req.user?._id,
        duration : videoFile.duration,
        isPublished:true
    })

    const createdVideo = await Video.findById(video?._id)
    if (!createdVideo) {
        throw new ApiError(400, "Failed to create the video")
        
    }

    //5. return the response
    res.status(201).json(new ApiResponse(201,video ,"Video created successfully")) 




})





export {
    //getAllVideos,
    publishAVideo
    
}