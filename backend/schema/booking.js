const mongoose=require("mongoose")
const experience = require("./experience")

const booking=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    experienceId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Experience",
        required:true


    },
    payment:{
        type:Number,
        required:true
    },
    bookingDate:{
        type:Date,
        required:true
    },
    groupSize:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        enum:["confirmed","cancelled"],
        default:"confirmed"

    },
    refundStatus:{
        type:String,
        enum:["none","requested","approved","rejected"],
        default:"none"
    }
    
   
     
    
}, {timestamps:true})