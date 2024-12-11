import React, { useState, createContext } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Users from "./components/Users";
import Questions from "./components/Questions";
import Admin from "./components/Admin";
import Requests from "./components/Requests";

import ProtectedRoute from "./components/ProtectedRoute"; // Importăm ruta protejată
import Reviewer from "./components/Reviewer";

export const AuthContext = createContext();

function App() {
    const [user, setUser] = useState(() => {
        var savedUser = sessionStorage.getItem("user");

        if (savedUser == null)
            savedUser = localStorage.getItem("user");

        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (userData, remember) => {
        setUser(userData);

        if (remember)
            localStorage.setItem("user", JSON.stringify(userData));
        else
            sessionStorage.setItem("user", JSON.stringify(userData));

        window.location.href = "/questions";
    };

    const logout = () => {
        setUser(null);

        localStorage.removeItem("user");
        sessionStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <BrowserRouter>
                {user && (
                    <div className="menu">
                        <div className="menu-top">
                            <div className="pfp"></div>
                            <p className="username">{user.role === "admin" ? "💎" : (user.role === "reviewer" ? "👀" : "")} {user.username}</p>
                        </div>
                        <div className="menu-middle">
                            <div className="level-container">
                                <div className="level">Level {Math.floor(user.xp / 100)}</div>
                                <div className="xp">
                                    <div className="xp-fill" style={{width: `${user.xp % 100}%`}}></div>
                                </div>
                            </div>
                            <p>{100 - (user.xp % 100)} xp away from reaching level {Math.floor(user.xp / 100) + 1}</p>
                        </div>
                        <div className="menu-options">
                            <Link to="/questions" className="nav-link">Exercises</Link>
                            <Link to="/leaderboards" className="nav-link">Leaderboards</Link>
                            {user.role === "admin" && (<Link to="/admin/exercises" className="nav-link">Exerciții</Link>)}
                            {user.role === "admin" && (<Link to="/admin/users" className="nav-link">Utilizatori</Link>)}
                            {user.role === "admin" && (<Link to="/admin/requests" className="nav-link">Solicitări</Link>)}
                            {user.role === "reviewer" && (<Link to="/reviewer/exercises" className="nav-link">Exerciții</Link>)}
                            <Link onClick={logout}>Sign Out</Link>
                        </div>
                    </div>
                )}
                <div className="content">
                    <Routes>
                        <Route path="/" element={user ? <Navigate to="/questions" /> : <Navigate to="/login" />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={ <Register />} />
                        
                        {user?.role === "admin"  &&(<Route path="/admin/requests" element= { <ProtectedRoute><Requests /></ProtectedRoute> } />)}
                
                        <Route path="/questions" element={<ProtectedRoute><Questions/></ProtectedRoute>}/>

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
