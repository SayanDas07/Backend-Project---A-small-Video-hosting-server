import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema({
    username :{
        type : String,
        required : true,
        unique : true,
        trim : true,
        index : true,
        lowercase : true
    },
    email :{
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true
    },
    fullName :{
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar :{
        type : String, //cloudinary url
        required : true
    },
    coverImage :{
        type : String, //cloudinary url
    },
    watchHistory :[
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password :{
        type :String,
        required : [true, "Password is required"]
    },
    refreshToken :{
        type : String
    }
},{timestamps : true})



//MiddleWare for hashing password -> pre save hook
userSchema.pre("save", async function(next){
    //hash password before saving but only if password is modified
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password,10)
    next()


})

//Method to check if password is correct 
userSchema.methods.isPasswordCorrect = async function(password){

    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            //payloads
            _id : this._id,
            username : this.username,
            email : this.email,
            fullName : this.fullName,

        },
        //secret key
        process.env.ACCESS_TOKEN_SECRET,

        {
            //expiry
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )



}


export const User = mongoose.model("User", userSchema);



/*  NOTES ABOUT ACCESS TOKEN AND REFRESH TOKEN :-
  


1.access tokens are short lived and refresh tokens are long lived.

2.jotokhon access token tahkbe totokhon you are authenticate. access token expire howar por refresh token use kore new access token generate kora hoy.

3.karon nahole user ke bar bar password diye login korte hobe. refresh token use kore access token generate kora hoy. refresh token expire howar por user ke login korte hobe.

4.refresh token db te store tahke + user keo deoya hoy if 2to match hoy then access token generate kora hoy. refresh token expire howar por

REFRESH TOKEN DB TE STORE THAKE + USER KE DEOYA HOY but access token db te store thake na + user ke deoya hoy
*/
