import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasRole, hasAnyRole, hasPermission } from '../utils/roleUtils'

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = null, 
  requiredPermission = null,
  fallbackPath = '/dashboard' 
}) => {
  const { user, isAuthenticated } = useAuth()

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (requiredRole && !hasRole(user, requiredRole)) {
    return <Navigate to={fallbackPath} replace />
  }

  // Check multiple roles access
  if (requiredRoles && !hasAnyRole(user, requiredRoles)) {
    return <Navigate to={fallbackPath} replace />
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to={fallbackPath} replace />
  }

  // User has access, render the component
  return children
}

export default ProtectedRoute
