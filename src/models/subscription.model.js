import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber :{
        type : Schema.Types.ObjectId, //user who is subscribing
        ref : "User"     
    },
    channel :{
        type : Schema.Types.ObjectId,  //user who is being subscribed by 'subscriber'
        ref : "User"  

    }


    
},{timeseries : true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)