const OpenAI=require("openai")

const ai= new OpenAI({
    apiKey:process.env.openai

})
module.exports=ai 