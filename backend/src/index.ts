import "dotenv/config"
import cors from "cors";
import express from "express";


const app = express();
app.use(cors());
app.use(express.json());
const port=process.env.PORT || 3000
app.listen(port, () => console.log("server is running on port",port));
