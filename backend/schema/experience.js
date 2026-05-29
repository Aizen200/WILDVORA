const mongoose=require("mongoose")

const experience=new mongoose.Schema({

    hostId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    title:{
        type:String,
        required:true
    },

    location:{
        type:String,
        required:true
    },

    description:{
        type:String,
        required:true
    },

    photos:[String],

    price:{
        type:Number,
        required:true
    },

    duration:{
        type:String,
        required:true
    },

    category:{
        type:String,
        enum:[
            "camping",
            "trekking",
            "river rafting",
            "jungle stays",
            "cycling trails"
        ],
        required:true
    },

    difficulty:{
        type:String,
        enum:["easy","medium","hard"],
        required:true
    },

    maxGroupSize:{
        type:Number
    },

    inclusions:[String],

    exclusions:[String],

    cancellationPolicy:{
        type:String
    },

    availability:[Date],

    averageRating:{
        type:Number,
        default:0
    },

    totalReviews:{
        type:Number,
        default:0
    },

    status:{
        type:String,
        enum:[
            "draft",
            "pending",
            "live",
            "paused",
            "rejected",
            "changes_requested"
        ],
        default:"pending"
    }

},{
    timestamps:true
})
module.exports= mongoose.model("Experience",experience)