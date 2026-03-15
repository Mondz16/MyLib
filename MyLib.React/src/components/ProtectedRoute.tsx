import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({children} : {children: ReactNode}) {
    const {isAuthenticated} = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}