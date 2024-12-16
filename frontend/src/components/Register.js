import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";
import { Link } from "react-router-dom";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("User"); // Default role
    const [difficulty, setDifficulty] = useState("easy"); // Default difficulty
    const [message, setMessage] = useState("");
    const { login } = useContext(AuthContext);

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/register", {
                username,
                email,
                password,
                role,
                difficulty, // Send difficulty to the backend
            });
            const { user, token } = response.data;

            if (response.data.status === "success") {
                login(user, token,false); // Log in the user immediately after registration
                window.location.href = "/";
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Error connecting to the server."
            );
        }
    };

    return (
        <div className="login-card">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                </select>
                <label>Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                {message && <p className="error">⚠️ {message}</p>}
                <button type="submit" className="accent-btn">Register</button>
            </form>
            <p className="login-switch">Already have an account? <Link to="/login" className="link">Log in</Link></p>
        </div>
    );
}

export default Register;
