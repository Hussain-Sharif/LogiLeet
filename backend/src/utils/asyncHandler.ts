// Just to Standardize the Things
const asyncHandler=(requestHandler:Function)=>{ // To utlize the DB Connection every time we Request or  etc...
    return (req:any,res:any,next:any)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export default asyncHandler

/*
The main benefits of using asyncHandler are:

1)It eliminates the need to write try-catch blocks in every async route handler.
2)It automatically catches any errors thrown in the async function and passes them to Express's error handling middleware.
3)It allows you to use async/await syntax in your route handlers without worrying about unhandled promise rejections.
*/