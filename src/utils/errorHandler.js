// Comprehensive error handling utility for API calls

export const getErrorMessage = (error) => {
  // Check if it's a network error (no response from server)
  if (!error.response && error.message === 'Failed to fetch') {
    return {
      type: 'network',
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and ensure the backend server is running.',
      details: 'This usually means the backend server is not running or there\'s a network connectivity issue.',
      suggestions: [
        'Check if the backend server is running on http://localhost:8080',
        'Verify your internet connection',
        'Try refreshing the page',
        'Contact your system administrator if the problem persists'
      ]
    }
  }

  // Check if it's a timeout error
  if (error.message && error.message.includes('timeout')) {
    return {
      type: 'timeout',
      title: 'Request Timeout',
      message: 'The request took too long to complete. The server might be overloaded.',
      details: 'This usually means the server is taking too long to respond to your request.',
      suggestions: [
        'Try again in a few moments',
        'Check if the server is experiencing high load',
        'Contact your system administrator if the problem persists'
      ]
    }
  }

  // Check if it's a 500 Internal Server Error
  if (error.message && (error.message.includes('500') || error.message.includes('Internal Server Error'))) {
    return {
      type: 'server',
      title: 'Server Error',
      message: 'The server encountered an unexpected error while processing your request.',
      details: 'This indicates a problem on the server side that needs to be addressed.',
      suggestions: [
        'Try again in a few moments',
        'Check if the backend service is properly configured',
        'Contact your system administrator',
        'Check the server logs for more details'
      ]
    }
  }

  // Check if it's a 404 Not Found
  if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
    return {
      type: 'notfound',
      title: 'Resource Not Found',
      message: 'The requested resource could not be found on the server.',
      details: 'This usually means the API endpoint doesn\'t exist or the resource has been moved.',
      suggestions: [
        'Verify the API endpoint is correct',
        'Check if the resource still exists',
        'Contact your system administrator',
        'Try refreshing the page'
      ]
    }
  }

  // Check if it's a 401 Unauthorized
  if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
    return {
      type: 'unauthorized',
      title: 'Authentication Required',
      message: 'You need to log in to access this resource.',
      details: 'Your session may have expired or you may not have the required permissions.',
      suggestions: [
        'Please log in again',
        'Check if your session has expired',
        'Contact your administrator if you believe this is an error'
      ]
    }
  }

  // Check if it's a 403 Forbidden
  if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
    return {
      type: 'forbidden',
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
      details: 'Your account doesn\'t have the required permissions for this action.',
      suggestions: [
        'Contact your administrator to request access',
        'Check if you\'re using the correct account',
        'Verify your role has the necessary permissions'
      ]
    }
  }

  // Check if it's a validation error (400 Bad Request)
  if (error.message && (error.message.includes('400') || error.message.includes('Bad Request'))) {
    return {
      type: 'validation',
      title: 'Invalid Request',
      message: 'The request data is invalid or incomplete.',
      details: 'Please check your input and try again.',
      suggestions: [
        'Review the form data for any missing or invalid fields',
        'Check if all required fields are filled',
        'Verify the data format is correct'
      ]
    }
  }

  // Generic error fallback
  return {
    type: 'unknown',
    title: 'An Error Occurred',
    message: error.message || 'An unexpected error occurred while processing your request.',
    details: 'Please try again or contact support if the problem persists.',
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact your system administrator',
      'Try again in a few moments'
    ]
  }
}

export const isNetworkError = (error) => {
  return !error.response && error.message === 'Failed to fetch'
}

export const isServerError = (error) => {
  return error.message && (error.message.includes('500') || error.message.includes('Internal Server Error'))
}

export const isTimeoutError = (error) => {
  return error.message && error.message.includes('timeout')
}

export const isAuthError = (error) => {
  return error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized') || error.message.includes('Forbidden'))
}
