import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("User"); // Rol implicit
    const [message, setMessage] = useState("");
    const { login } = useContext(AuthContext);

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/register", {
                username,
                email,
                password,
                role, // Trimitem rolul selectat
            });
            if (response.data.status === "success") {
                login(response.data.user); // Loghează utilizatorul imediat după înregistrare
                setMessage("Înregistrare reușită!");
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
        <div>
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
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <br />
                <label>
                    Selectați Rolul:
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="reviewer">Reviewer</option>
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
