import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectionDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Database Connected at ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB Connection Error:",error);
        process.exit(1)
    }
}

export default connectionDB