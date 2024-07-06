import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    //STEPS :-
    //1. collect channelId from req.params
    //2. check if channelId is valid and exists
    //3. find all users who are subscribed to the channel
    //4. return success response with user list

    //1. collect channelId from req.params
    const {channelId} = req.params

    //2. check if channelId is valid and exists
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }

    //3. find all users who are subscribed to the channel
    const subscribers = await Subscription.aggregate([
        //match the channel id
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        //lookup the user collection to get the user details
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriberFromSubscriptionsModel"
            }
        },
        //unwind the subscriberFromSubscriptionsModel array to get the user details
        {
            $unwind : "$subscriberFromSubscriptionsModel"
        },
        //project the required fields
        {
            $project : {
                username : "$subscriberFromSubscriptionsModel.username",
                email : "$subscriberFromSubscriptionsModel.email",
                fullName : "$subscriberFromSubscriptionsModel.fullName"

            }
        }
    ])

    //console.log(subscribers)
    //console.log("Querying for channel ID:", channelId);

    

    //4. return success response with user list
    if (subscribers.length === 0) {
        return res.status(200).json(
            new ApiResponse(200,subscribers , "No subscribers found for this channel")
        );
    }
    res.status(200).json(
        new ApiResponse(214,subscribers,"Subscribers List")
    )
})

// controller to return channel list to which user has subscribed


export {
    getUserChannelSubscribers
}