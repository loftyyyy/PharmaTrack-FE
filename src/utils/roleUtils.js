// Role constants
export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  PHARMACIST: 'PHARMACIST',
  MANAGER: 'MANAGER',
  TECHNICIAN: 'TECHNICIAN'
}

// Check if user has admin privileges
export const isAdmin = (user) => {
  if (!user || !user.role) return false
  const role = typeof user.role === 'string' ? user.role : user.role.name || user.roleName
  return role === ROLES.ADMIN
}

// Check if user has staff privileges (includes all non-admin roles)
export const isStaff = (user) => {
  if (!user || !user.role) return false
  const role = typeof user.role === 'string' ? user.role : user.role.name || user.roleName
  return [ROLES.STAFF, ROLES.PHARMACIST, ROLES.MANAGER, ROLES.TECHNICIAN].includes(role)
}

// Check if user has specific role
export const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false
  const role = typeof user.role === 'string' ? user.role : user.role.name || user.roleName
  return role === requiredRole || role === ROLES.ADMIN // Admin has access to everything
}

// Check if user has any of the specified roles
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role) return false
  const userRole = typeof user.role === 'string' ? user.role : user.role.name || user.roleName
  return roles.includes(userRole) || userRole === ROLES.ADMIN
}

// Get user role as string
export const getUserRole = (user) => {
  if (!user || !user.role) return null
  return typeof user.role === 'string' ? user.role : user.role.name || user.roleName
}

// Get role display name
export const getRoleDisplayName = (role) => {
  const roleMap = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.STAFF]: 'Staff Member',
    [ROLES.PHARMACIST]: 'Pharmacist',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.TECHNICIAN]: 'Technician'
  }
  return roleMap[role] || role
}

// Define permissions for each role
export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'dashboard.view',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete',
    'inventory.view', 'inventory.edit',
    'stock.view', 'stock.edit',
    'adjustments.view', 'adjustments.create', 'adjustments.edit',
    'logs.view',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
    'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'pos.access',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
    'reports.view', 'reports.generate'
  ],
  [ROLES.STAFF]: [
    'dashboard.view',
    'sales.view', 'sales.create',
    'pos.access',
    'customers.view', 'customers.create', 'customers.edit'
  ],
  [ROLES.PHARMACIST]: [
    'dashboard.view',
    'products.view',
    'inventory.view',
    'stock.view',
    'sales.view', 'sales.create',
    'pos.access',
    'customers.view', 'customers.create', 'customers.edit',
    'reports.view'
  ],
  [ROLES.MANAGER]: [
    'dashboard.view',
    'products.view', 'products.create', 'products.edit',
    'inventory.view', 'inventory.edit',
    'stock.view', 'stock.edit',
    'adjustments.view', 'adjustments.create',
    'suppliers.view', 'suppliers.create', 'suppliers.edit',
    'purchases.view', 'purchases.create', 'purchases.edit',
    'customers.view', 'customers.create', 'customers.edit',
    'sales.view', 'sales.create', 'sales.edit',
    'pos.access',
    'reports.view', 'reports.generate'
  ]
}

// Check if user has specific permission
export const hasPermission = (user, permission) => {
  const role = getUserRole(user)
  if (!role) return false
  
  const rolePermissions = PERMISSIONS[role] || []
  return rolePermissions.includes(permission)
}

// Get all permissions for user
export const getUserPermissions = (user) => {
  const role = getUserRole(user)
  return PERMISSIONS[role] || []
}
