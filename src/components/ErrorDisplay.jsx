import { useState } from 'react'
import { getErrorMessage } from '../utils/errorHandler'

const ErrorDisplay = ({ error, onDismiss, isDarkMode = false, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false)
  
  if (!error) return null

  const errorInfo = getErrorMessage(error)

  const getErrorIcon = (type) => {
    switch (type) {
      case 'network':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
        )
      case 'timeout':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'server':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'notfound':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'unauthorized':
      case 'forbidden':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )
      case 'validation':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getErrorColor = (type) => {
    switch (type) {
      case 'network':
        return 'bg-orange-100 border-orange-400 text-orange-800'
      case 'timeout':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      case 'server':
        return 'bg-red-100 border-red-400 text-red-800'
      case 'notfound':
        return 'bg-purple-100 border-purple-400 text-purple-800'
      case 'unauthorized':
      case 'forbidden':
        return 'bg-indigo-100 border-indigo-400 text-indigo-800'
      case 'validation':
        return 'bg-blue-100 border-blue-400 text-blue-800'
      default:
        return 'bg-red-100 border-red-400 text-red-800'
    }
  }

  return (
    <div className={`mb-6 p-4 border rounded-lg ${getErrorColor(errorInfo.type)} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getErrorIcon(errorInfo.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {errorInfo.title}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm underline hover:no-underline"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="ml-2 text-current hover:opacity-75"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm">
            {errorInfo.message}
          </p>
          
          {showDetails && (
            <div className="mt-3 space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Details:</h4>
                <p className="text-sm opacity-90">{errorInfo.details}</p>
              </div>
              
              {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Suggestions:</h4>
                  <ul className="text-sm opacity-90 list-disc list-inside space-y-1">
                    {errorInfo.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {error.message && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Technical Details:</h4>
                  <code className="text-xs bg-black bg-opacity-10 px-2 py-1 rounded block">
                    {error.message}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay
