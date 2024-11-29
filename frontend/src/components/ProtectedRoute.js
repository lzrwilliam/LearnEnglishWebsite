import React from "react";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../App";

function ProtectedRoute({ children }) {
    const { user } = useContext(AuthContext);

    // Verifică dacă utilizatorul este logat
    if (!user) {
        return <Navigate to="/login" replace />;
    }
   

    return children;
}

export default ProtectedRoute;
