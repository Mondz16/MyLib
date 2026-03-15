import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage.tsx";
import FavoritesPage from "./pages/FavoritesPage.tsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<SearchPage />} />
              <Route path="/favorites" 
                element= {
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
              } />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <div className="text-center text-gray-500 py-12">
                      Favorites page — coming in Phase 4
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
