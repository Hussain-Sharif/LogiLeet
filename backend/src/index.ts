import 'dotenv/config' // Once added here it will read .env file at the start of the server top file and we can use it anywhere we wanted to

import connectionDB from './db/connection.js'

connectionDB()