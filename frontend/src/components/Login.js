import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";
import { Link } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [remember, setRemember] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/login", { username, password });
            const { user, token } = response.data;

           
            if (response.data.status === "success")
                login(user, token,remember);
            else
                setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Eroare la conectarea cu serverul."
            );
        }
    };

    return (
        <div className="login-card">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className="remember-me">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}/>
                    <label>Remember me</label>
                </div>
                {message && <p className="error">⚠️ {message}</p>}
                <button type="submit" className="accent-btn">Login</button>
                {/* <Link to="/register"><button>Register</button></Link> */}
            </form>
            <p className="login-switch">Don't have an account yet? <Link to="/register" className="link">Register now!</Link></p>
        </div>
    );
}

export default Login;
