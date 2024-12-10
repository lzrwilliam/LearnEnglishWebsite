import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";
import "../styles/Login.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/login", { username, password });
            if (response.data.status === "success") {
                login(response.data.user);
                window.location.href = "/";
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Eroare la conectarea cu serverul."
            );
        }
    };

    return (
        <div className="login">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <br />
                <input
                    type="text"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <br />
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;
