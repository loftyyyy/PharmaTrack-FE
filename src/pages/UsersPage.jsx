const UsersPage = ({ isDarkMode }) => {
  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        User Management
      </h1>
      <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          User management features coming soon...
        </p>
      </div>
    </div>
  )
}

export default UsersPage
