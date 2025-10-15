class ApiError extends Error{
    public data:any
    constructor(
        public statusCode:number, // To give StatusCode
        public message:string="Something went Wrong by API ERROR.js", // Default Text to give message for the Error or we can change it as well when this class is called
    ){
        super(message) // we overwrite the Message
        this.statusCode=statusCode // To Overwrite the Status Code 
        this.data=null
        this.message=message
        Error.captureStackTrace(this,this.constructor)
    }
}

export {ApiError}

// This Completely Returned when called with some values/params as Object 