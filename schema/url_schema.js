
import mongoose from "mongoose";

const urlSchema=mongoose.Schema({
    id:{type:Number},
    url:{type:String},
    shortCode:{type:String},
});

export const urls=mongoose.model("url",urlSchema);