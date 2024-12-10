import React, { useState, createContext } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Users from "./components/Users";
import Questions from "./components/Questions";
import Admin from "./components/Admin";
import Requests from "./components/Requests";

import ProtectedRoute from "./components/ProtectedRoute"; // Importăm ruta protejată
import "./styles/Navbar.css";
import "./styles/App.css";
import Reviewer from "./components/Reviewer";

export const AuthContext = createContext();

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <BrowserRouter>
                <div className="navbar">
                    <nav>
                        {!user ? (
                            <>
                                <Link to="/login" className="nav-link">Login</Link>
                                <Link to="/register" className="nav-link">Register</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/questions" className="nav-link">Întrebări</Link>
                                {user.role === "admin" && (
                                    <div className="dropdown">
                                        <button className="dropdown-button">Admin</button>
                                        <div className="dropdown-content">
                                            <Link to="/admin/exercises" className="nav-link">Exerciții</Link>
                                            <Link to="/admin/users" className="nav-link">Utilizatori</Link>
                                            <Link to="/admin/requests" className="nav-link">Solicitări</Link>

                                        </div>
                                    </div>
                                )}
                                   {user.role === "reviewer" && (
                                    <div className="dropdown">
                                        <button className="dropdown-button">Reviewer</button>
                                        <div className="dropdown-content">
                                            <Link to="/reviewer/exercises" className="nav-link">Exerciții</Link>
                                        </div>
                                    </div>
                                )}
                                <button className="logout" onClick={logout}>Sign Out</button>
                            </>
                        )}
                    </nav>
                </div>
                <div className="content">
                    <Routes>
                        <Route path="/" element={user ? <Navigate to="/questions" /> : <Navigate to="/login" />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={ <Register />} />
                        
                    { user?.role === "admin"  &&(<Route path="/admin/requests" element= { <ProtectedRoute><Requests /></ProtectedRoute> } />
                    )}
                
                        <Route
                            path="/questions"
                            element={
                                <ProtectedRoute>
                                    <Questions />
                                </ProtectedRoute>
                            }
                        />
                        {user?.role === "admin" && (
                            <Route path="/admin/exercises" element={ <Admin />} />
                        )}
                        {user?.role === "admin" && (
                            <Route path="/admin/users" element={<Users/>}  />
                        )}
                        {user?.role === "reviewer" && (
                            <Route path="/reviewer/exercises" element={<Reviewer />} />
                        )}
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

export default App;
