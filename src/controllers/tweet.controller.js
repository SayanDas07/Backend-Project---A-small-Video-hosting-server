import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"

import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


// TODO : Do Likes part when likes cotroller is created

const createTweet = asyncHandler(async (req, res) => {
    //Steps:
    // 1. Validate request
    // 2. Create tweet
    // 3. handle response
    // 4. return response

    // 1. Validate request
    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid user id")
    }

    // 2. Create tweet
    const tweet = await Tweet.create(
        {
            content : content,
            owner: req.user?._id
        }
    
    )

    // 3. handle response
    if (!tweet) {
        throw new ApiError(500, "Tweet creattion failed")
        
    }

    //console.log(tweet.owner)
    //console.log(req.user)

    // 4. return response
    return res.status(201).json(new ApiResponse(201,tweet, "Tweet created successfully"))
})

// Get user tweets by user id
const getUserTweets = asyncHandler(async (req, res) => {
    //Steps:
    // 1. Validate request
    // 2. Get user tweets
    // 3. handle response
    // 4. return response
    try {
        // 1. Validate request
        const {userId} = req.params
        if (!userId) {
            throw new ApiError(400, "not logged in")
            
        }
        // 2. Get user tweets
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $project: {
                    owner: 1,
                    content: 1,
                    createdAt: 1,
                    
    
                }
            }
            
    
        ])
    
        // 3. handle response
        if (!tweets) {
            throw new ApiError(404, "Tweets not found")
            
        }
    
        //console.log("owner is",tweets[0].owner)
    
        
    
        // 4. return response
        if (tweets.length === 0) {
            return res.status(200).json(new ApiResponse(200, tweets, "No tweets found"))
            
        }
        return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
    } catch (error) {
        throw new ApiError(404, "User not found")
        
    }
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //Steps:
    // 1. Validate request
    // 2. Update tweet.
    // 3. handle response
    // 4. return response

    // 1. Validate request
    const { tweetId } = req.params
    if (!tweetId) {
        throw new ApiError(400, "Invalid tweet id")  
    }

    //check if tweet exists
    const oldTweet = await Tweet.findById(tweetId)
    if (oldTweet.content === req.body?.content) {
        throw new ApiError(400, "No changes made")
        
    }

    // 2. Update tweet
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content: req.body?.content
        },
        {
            new: true
        }
    
    )

    // 3. handle response
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
        
    }

    // 4. return response
    return res.status(200).json(new ApiResponse(202, tweet, "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //Steps:
    // 1. Validate request
    // 2. Delete tweet
    // 3. handle response
    // 4. return response

    // 1. Validate request
    const { tweetId } = req.params
    if (!tweetId) {
        throw new ApiError(400, "Invalid tweet id")
        
    }

    // 2. Delete tweet
    const tweet = await Tweet.findByIdAndDelete(tweetId)

    // 3. handle response
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
        
    }

    console.log("deleted content",tweet.content)

    // 4. return response
    return res.status(200).json(new ApiResponse(209, tweet, "Tweet deleted successfully"))
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}