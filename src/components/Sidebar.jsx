import { Link, useLocation } from 'react-router-dom'

const Sidebar = ({ isDarkMode, sidebarItems }) => {
  const location = useLocation()
  return (
    <div className={`w-64 text-white shadow-lg flex flex-col border-r transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-pharma-dark bg-slate-800 border-gray-300'
    }`}>
      {/* Logo and Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pharma-medium to-pharma-teal rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2h2V6h5v5h2v2h-2v5H11v-2H9v2H4v-5H2v-2h2V6zm5 5H7v2h2v-2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">PharmaTrack</h1>
            <p className="text-xs text-white/60">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  location.pathname === item.path
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-center text-white/40 text-xs">
          <p>&copy; 2024 PharmaTrack</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
