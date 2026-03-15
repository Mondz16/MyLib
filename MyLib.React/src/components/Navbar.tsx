import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-blue-600">
        📚 MyLib
      </Link>
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="text-gray-600 hover:text-blue-600 text-sm font-medium"
        >
          Search
        </Link>
        {isAuthenticated ? (
          <>
            <Link
              to="/favorites"
              className="text-gray-600 hover:text-blue-600 text-sm font-medium"
            >
              Favorites
            </Link>
            <span className="text-sm text-gray-500">Hi, {user?.username}</span>
            <button
              onClick={logout}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-gray-600 hover:text-blue-600 text-sm font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
