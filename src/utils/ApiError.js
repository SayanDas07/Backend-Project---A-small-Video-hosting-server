class ApiError extends Error {
    constructor( // Define the shape of the error object
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){ // Define the properties of the error object
        super(message) // Call the parent constructor with the message
        this.statusCode = statusCode // Define the status code
        this.data = null
        this.message = message
        this.success = false; // Define the success property
        this.errors = errors // Define the errors property

        if (stack) {    // Check if the stack property is provided
            this.stack = stack // Define the stack property
        } else{
            Error.captureStackTrace(this, this.constructor) // Capture the stack trace
        }

    }
}

export { ApiError }