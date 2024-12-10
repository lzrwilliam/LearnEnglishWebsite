import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";
import "../styles/Login.css";

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
            if (response.data.status === "success") {
                login(response.data.user); // Log in the user immediately after registration
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
        <div className="login">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <br />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <br />
                <input
                    type="text"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <br />
                <label>
                    Select Role:
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="reviewer">Reviewer</option>
                    </select>
                </label>
                <br />
                <label>
                    Select Difficulty:
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </label>
                <br />
                <button type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Register;
