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
                _id: 0,
                username : "$subscriberFromSubscriptionsModel.username",
                email : "$subscriberFromSubscriptionsModel.email",
                fullName : "$subscriberFromSubscriptionsModel.fullName"

            }
        }
    ])

    console.log(subscribers)
    console.log("Querying for channel ID:", channelId);

    

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
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //STEPS :-
    //1. collect subscriberId from req.params
    //2. check if subscriberId is valid and exists
    //3. find all channels to which user has subscribed
    //4. return success response with channel list

    //1. collect subscriberId from req.params
    const { subscriberId } = req.params

    //2. check if subscriberId is valid and exists
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber Id")
    }

    //3. find all channels to which user has subscribed
    const channels = await Subscription.aggregate([
        //match the subscriber id
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        //lookup the user collection to get the user details
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscriberSubscribedToChannel"
            }
        },
        //unwind the subscriberSubscribedToChannel array to get the user details
        {
            $unwind: "$subscriberSubscribedToChannel"
        },
        //project the required fields
        {
            $project: {
                _id: 0,
                username: "$subscriberSubscribedToChannel.username",
                email: "$subscriberSubscribedToChannel.email",
                fullName: "$subscriberSubscribedToChannel.fullName"

            }
        }
    ])

    console.log(channels)
    console.log("Querying for subscriber ID:", subscriberId);

    //4. return success response with channel list
    if (channels.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, channels[0], "No channels found to which user has subscribed")
        );
    }
    res.status(200).json(
        new ApiResponse(214, channels[0], "Channels List")
    )
})

const toggleSubscription = asyncHandler(async (req, res) => {
    //STEPS :-
    //1. collect channelId from req.params
    //2. check if channelId is valid and exists
    //3. check if user is already subscribed to the channel
    //4. if user is already subscribed then unsubscribe else subscribe
    //5. return success response with channel list

    //1. collect channelId from req.params
    const {channelId} = req.params

    //2. check if channelId is valid and exists
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }

    //3. check if user is already subscribed to the channel
    const user = req.user 
    if(!user){
        throw new ApiError(400,"user not logged in")
    }

    const subscriberId = user?._id

    const subscription = await Subscription.findOne({
        channel : channelId,
        subscriber : subscriberId
    })

    //4. if user is already subscribed then unsubscribe else subscribe

    if(subscription){
        //unsubscribe
        await Subscription.findByIdAndDelete(subscription?._id)
        return res.status(200).json(
            new ApiResponse(200,{},"Unsubscribed successfully")
        )
    }

    //subscribe
    await Subscription.create({
        channel : channelId,
        subscriber : subscriberId
    })
    res.status(200).json(
        new ApiResponse(214,{},"Subscribed successfully")
    )

})

export {
    getUserChannelSubscribers,
    getSubscribedChannels,
    toggleSubscription
}