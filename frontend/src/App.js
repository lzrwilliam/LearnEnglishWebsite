import React, { useState, createContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Users from "./components/Users";
import Questions from "./components/Questions";
import Requests from "./components/Requests";
import Notifications from "./components/Notifications";

import api from "./api"; 

import ReviewerPendingRequests from "./components/ReviewerPendingRequests";

import ProtectedRoute from "./components/ProtectedRoute"; // Importăm ruta protejată
import Reviewer from "./components/Reviewer";

export const AuthContext = createContext();

function App() {
    const [user, setUser] = useState(() => {
        var savedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const updateXp = (newXp) => {
        const updatedUser = { ...user, xp: newXp };

        setUser(updatedUser);

        if (localStorage.getItem("user"))
            localStorage.setItem("user", JSON.stringify(updatedUser));
        else
            sessionStorage.setItem("user", JSON.stringify(updatedUser));
    };
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (user) {
                try {
                    const response = await api.get(`/notifications/unread_count/${user.id}`);
                    setUnreadCount(response.data.unread_count);
                } catch (error) {
                    console.error("Error fetching unread notifications count:", error);
                }
            }
        };

        fetchUnreadCount();

    }, [user]);

    const login = (userData, remember) => {
        setUser(userData);

        if (remember)
            localStorage.setItem("user", JSON.stringify(userData));
        else
            sessionStorage.setItem("user", JSON.stringify(userData));
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

                            <Link to="/questions" className="nav-link">✏️ Exercises</Link>
                            <Link to="/leaderboards" className="nav-link">🌍 Leaderboards</Link>
                            
                            <Link to="/notifications" className="nav-link">
                                <div style={{position: "relative"}}>
                                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                    🔔
                                </div>
                                <div>&nbsp;Notifications</div>
                            </Link>

                            {user.role === "admin" && (<Link to="/admin/requests" className="nav-link">✉️ Requests</Link>)}
                            {user.role === "reviewer" && (<Link to="/reviewer/exercises" className="nav-link">📖 Review</Link>)}
                            {user.role === "reviewer" && (<Link to="/reviewer/requests" className="nav-link">✉️ Requests</Link>)}

                            <Link onClick={logout}>↪ Sign out</Link>
                        </div>
                    </div>
                )}
                <div className="content">
                    <Routes>

                        <Route path="/" element={<Navigate to="/questions"/>} />
                        <Route path="/login" element={user ? <Navigate to="/"/> : <Login/>} />
                        <Route path="/register" element={user ? <Navigate to="/"/> : <Register/>} />
                        
                        <Route path="/questions" element={<ProtectedRoute><Questions updateXp={updateXp}/></ProtectedRoute>}/>
                        <Route path="/notifications" element={<ProtectedRoute><Notifications/></ProtectedRoute>} />

                        {/* probabil ca putem sa facem mai bine aici */}
                        {user?.role === "admin"  &&(<Route path="/admin/requests" element= {<Requests/>} />)}
                        {user?.role === "admin"  &&(<Route path="/admin/users" element= {<Users/>} />)}
                        {user?.role === "reviewer" && <Route path="/reviewer/exercises" element={<Reviewer/>} />}
                        {user?.role === "reviewer" && <Route path="/reviewer/requests" element={<ReviewerPendingRequests/>} />}
                    
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

export default App;

// toti
//     - exercitii
//     - leaderboard
//     - edit profile
//     - report la intrebare
//     - notificari { de la reviwer aprobat sau respins, si de la admin pt rol }

// admin 
//     - request pentru role change
//     - ban kick la leaderboard
//     - doar el vede useri cu ban, care sunt la final de leaderboard
//     - filtru in plus la leaderboard ***

// reviwer 
//     - request pentru exercitii
//     - adauga sterge modifica exercitii

// Edit profile:
//     - dificultatea
//     - request pentru admin sau reviwer
//     - sterge contul
//     - edit general {nume, parola, pfp, email}

// exercitii ...
// leaderboard (posibil search) si admin vede ban si kick si aia banati
// menuiu notificari primele alea necitite plsu buton de clear all mark all as read, poza si nume
// edit profile, request pentru rol, delete account, difcultate (edit general)
// request de role poza nume mesaj si 2 butoane accept si reject
// meniu review cu toate intrebarile plus pop up pentru intrebare nou sau edit la o intrebare
// request de exercitii poza nume mesaj si 2 butoane vezi detalii si reject si dupa ce apasa pe detalii paote modifica intrebarea si buton de aprove