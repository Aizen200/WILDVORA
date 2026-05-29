
const mongoose=require("mongoose")
const user= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["customer","operator","admin"],

        required:true
    },
    kyc:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending"
    },
    payoutStatus:{
        type:String,
        enum:["verified","pending"],
        default:"pending"

    },
    isActive:{
        type:Boolean,
        default:true
    }

}, {timestamps:true})
module.exports= mongoose.model("User",user)