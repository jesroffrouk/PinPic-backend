class ApiResponse {
  constructor(
    statusCode = 200,
    data,
    message = 'Success',
    success = true,
    error = null
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.statusCode = statusCode;
  }
}

export default ApiResponse;
