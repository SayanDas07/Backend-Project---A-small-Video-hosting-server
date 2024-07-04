import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import e from 'express'


//Method for generating access token and refresh token
const generateAccessTokenAndRefreshTokens = async(userId) => {
    try {

        const user = await User.findById(userId) //now the the user obj is available

        //generating access token and refresh token
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //saving the refresh token in db
        user.refreshToken = refreshToken
        //validateBeforeSave : false - to avoid validation error
        await user.save({ validateBeforeSave : false})


        //user ke diye dilam
        return { accessToken, refreshToken}

        
    } catch (error) {

        throw new ApiError(500, "Something went wrong while generating tokens")
        
    }

}


//FOR REGISTRATION =>
const registerUser = asyncHandler ( async (req,res) => {
    //ALL STEPS FOR REGISTRATION
    //1. get user details from frontend
    //2. validation - non empty 
    //3. check if user already exists : username + email
    //4. check for images : compoulsary avatar (by multer)
    //5. upload image to cloudinary, check again for avatar
    //6. create user obj - create entry in db
    //7. Remove password and refresh token filed from response before sending 
    //8. check for user creation
    //9. return response 

    //1
    //destructuring user details from req.body
    const {fullName ,email, username , password} = req.body
    //console.log(email)

    //2
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        
        throw new ApiError(/*statusCode*/ 400, /*message*/"All fields are required")
    }

    //3
    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409, "User and email already exists")
    }

    

    //4
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    //if ? not working for coverImageLocalPath
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
        
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
        
    }

    //5
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar")
        
    }

    //6
    const user = await User.create({
        fullName,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })
    //console.log("user",user)


    //7
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //8
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")

        
    }

    //9
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )












    

})


//FOR LOGIN =>
const loginUser = asyncHandler(async (req,res) => {

    //ALL STEPS FOR LOGIN
    //1. req body theke data nebo
    //2. username or email
    //3. find the user in db
    //4. if user not found, throw error
    //5. if user exist check password
    //6. if password not match, throw error
    //7. if password match, generate access and refresh token and give it to user
    //8. send cookies


    //1+2
    const { email, username, password } = req.body

    //both email and username can't be empty
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required")
        
    }

    /*
    email or username can't be empty
    if (!(email ||username)) {
        throw new ApiError(400, "Email or username is required")
        
    }
        */
    

    //3

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    //4
    if (!user) {
        throw new ApiError(404, "User does not exist")
        
    }

    //5
    const isPasswordValid = await user.isPasswordCorrect(password)

    //6
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
        
    }

    //7
    const {accessToken , refreshToken} =  await generateAccessTokenAndRefreshTokens(user._id)


    //optional
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //8
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})


//LOGOUT
const logoutUser = asyncHandler(async (req,res) => {
    //1. remove refresh token from db
    //2. clear cookies
    

    //1
    await User.findByIdAndUpdate(
        //query
        req.user._id,
        {
            $unset : {
                refreshToken : 1 //remove the field
            }

        },
        {
            new : true
        }
    )

    //2

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200, {}, "User logged out")
    )

})


//END POINT FOR REFRESH ACCESS TOKEN =>
const refreshAccessToken = asyncHandler(async (req,res) => {

    //1. get refresh token from req.body(if mobile application) or req.cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    //2. check if refresh token is available
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
        
    }

    try {
        //3. verify the refresh token by JWT
        //we have the decoded raw token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        //4. find the user in db
        const user = await User.findById(decodedToken?._id)
    
        //5. check if user exists
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
            
        }
    
        //NOW AT THIS POINT WE HAVE THE VALID USER AND VALID REFRESH TOKEN
    
        //6. match the refresh token in db with the incoming refresh token
        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or Used")
            
        }
    
        //7. generate new access token and refresh token
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken,newRefreshToken} = await generateAccessTokenAndRefreshTokens(user._id)
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(200),
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed successfully" 
        
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
        
    }
    








})

//END POINT FOR CHANGING PASSWORD =>
const changeCurrentPassword = asyncHandler(async(req,res) => {

    const {oldPassword ,newPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    //now at this point we know oldpassword is correct or not
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
        
    }

    //Now set the new password
    user.password = newPassword
    await user.save({ validateBeforeSave : false})

    return res.status(200).json(
        new ApiResponse(200,{}, "Password changed successfully")
    )

})

//END POINT FOR GETTING CURRENT USER =>
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.ststus(200).json(
        new ApiResponse(200, req.user, "current user fetched successfully")
    
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if (!fullName && !email) {
        throw new ApiError(400, "All fields are required")
        
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "Account details updated successfully")
    )

})

const updateUserAvatar = asyncHandler(async(req,res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
        
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Failed to upload avatar")
        
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image is required")
        
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage .url) {
        throw new ApiError(400, "Failed to upload cover Image")
        
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})


const getUserChannelProfile = asyncHandler( async(req,res) => {
    // get username from url
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
        
    }

    const channel = await User.aggregate([
        //first pipeline
        //match the username with the username in db and get one user
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        //second pipeline
        //get the subscribers
        {
            $lookup : {
                //model name
                from : "subscriptions",
                //local field in user model
                localField : "_id",
                //foreign field in subscription model
                foreignField : "channel",
                //output field name
                as : "subscribers"
            }

        },
        //third pipeline
        //get whom the user is subscribed to
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            
            }
        },
        //fourth pipeline
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelSubscribedToCount : {
                    $size : "$subscribedTo"
                
                },
                isSubscribed : {
                    $cond : {
                        //if the user is logged in, then check if the user is subscribed to the channel
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }

            }
        },
        //fifth pipeline
        {
            $project : {
                fullName : 1,
                username : 1,
                avatar : 1,
                coverImage : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isSubscribed : 1,
                email : 1,
                createdAt : 1

            }
        }
    ])

    console.log("channel is ",channel)

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
        
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    )
    
})

const getWatchHistory = asyncHandler(async(req,res) => {

    const user = await User.aggregate([
        //first pipeline
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        //second pipeline
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }

                ]

            }

        }




    ])




    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})



export{ registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory}

