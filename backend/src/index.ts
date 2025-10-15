import 'dotenv/config' // Once added here it will read .env file at the start of the server top file and we can use it anywhere we wanted to

import connectionDB from './db/connection.js'
import {app} from './app.js'

connectionDB()
.then(() =>{
    console.log('Database Connection Promise is Successful')
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
.catch(err => console.log("MongoDB Connection Error!",err))