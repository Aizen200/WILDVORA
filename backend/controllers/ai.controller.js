const ai = require("../config/openai")
const  triplanner= async(req,res)=>{
   try{ const {message}=req.body
    const response= await ai.responses.create({
        model:"gpt-4.1-mini",
        input:`Extract trip prefrences from:
        "${message}"
        Return JSON only.
        `
    })
    res.status(200).json({
        'data': response.output_text

    })}
    catch(err){
        res.status(500).json({
            "mess":err.message
        })
    }
}
module.exports=triplanner
