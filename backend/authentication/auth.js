const express=require("express")
const User=require("../schema/user")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const router=express.Router()

router.post("/signup",async(req,res)=>{
    const{name,email,password,role}=req.body
    const findUser= await User.findOne({email})
    if (findUser){
        return res.status(409).send("User already exist")
    }
    const haspassword= await bcrypt.hash(password,10)
    const user= await User.create({
        name,
        email,
        password:haspassword,
        role
    })
    const token= jwt.sign({id:user._id,email:user.email,role:user.role},
        process.env.secret_key,{
            expiresIn:"1h"
        }
    )
    return res.status(201).json({"user":{
        _id:user._id,
        name:user.name,
        email:user.email,
        role:user.role
    },token})
})
router.post("/login",async(req,res)=>{
    const {email,password}=req.body
    const findUser= await User.findOne({
        email
    })
    if (!findUser){
        return res.status(400).send("User not found")
    }
    const compare= await bcrypt.compare(password,findUser.password)
    if (!compare){
        return res.status(400).send("Incorrect password")
    }
    const token= jwt.sign({id:findUser._id,email:findUser.email,role:findUser.role},
        process.env.secret_key,{
            expiresIn:"1h"
        }
    )
    return res.status(200).json({"user":{
        _id:findUser._id,
        email:findUser.email,
        role:findUser.role
    },token})

    
})