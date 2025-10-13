import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express() // This is called Composition root of express lib

app.use(express.json())
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"25kb"}))
app.use(express.urlencoded({extended:true,limit:"25kb"}))
app.use(express.static("public"))
app.use(cookieParser())


export default app;


