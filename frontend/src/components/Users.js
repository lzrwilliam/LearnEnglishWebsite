import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";
import "../styles/Users.css";

function Users() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [banReason, setBanReason] = useState("");
    const [userToBan, setUserToBan] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get(`/admin/users?admin_id=${user.id}`);
                setUsers(response.data.users);
            } catch (error) {
                setMessage("Eroare la încărcarea utilizatorilor.");
            }
        };
        if (user && user.role === "admin") {
            fetchUsers();
        }
    }, [user]);

    const handleBan = async () => {
        if (!userToBan || !banReason) {
            setMessage("Introduceți un motiv pentru banare.");
            return;
        }

        try {
            const response = await api.post("/admin/ban_user", {
                user_id: userToBan,
                reason: banReason,
            });
            if (response.data.status === "success") {
                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === userToBan
                            ? { ...user, is_banned: true, ban_reason: banReason }
                            : user
                    )
                );
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage("Eroare la banarea utilizatorului.");
        }
    };

    const handleUnban = async (userId) => {
        try {
            const response = await api.post("/admin/unban_user", { user_id: userId });
            if (response.data.status === "success") {
                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === userId ? { ...user, is_banned: false, ban_reason: null } : user
                    )
                );
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage("Eroare la unbanarea utilizatorului.");
        }
    };

    const handleKick = async (userId) => {
        const confirmKick = window.confirm("Ești sigur că vrei să ștergi acest utilizator?");
        if (!confirmKick) return;

        try {
            const response = await api.delete(`/admin/kick_user?user_id=${userId}`);
            if (response.data.status === "success") {
                setUsers((prev) => prev.filter((user) => user.id !== userId));
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage("Eroare la ștergerea utilizatorului.");
        }
    };

    return (
        <div className="users-page">
            <h2>Admin - Gestionare Utilizatori</h2>
            {message && <p>{message}</p>}
            <table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Rol</th>
            <th>XP</th> {/* Change this */}
            <th>Stare</th>
            <th>Acțiuni</th>
        </tr>
    </thead>
    <tbody>
        {users.map((user) => (
            <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.xp || 0}</td> {/* Display XP here */}
                <td>{user.is_banned ? "Banat" : "Activ"}</td>
                <td>
                    {user.is_banned ? (
                        <button
                            className="unban-btn"
                            onClick={() => handleUnban(user.id)}
                        >
                            Unban
                        </button>
                    ) : (
                        <button
                            className="ban-btn"
                            onClick={() => {
                                setUserToBan(user.id);
                                setBanReason("");
                            }}
                        >
                            Ban
                        </button>
                    )}
                    <button
                        className="kick-btn"
                        onClick={() => handleKick(user.id)}
                    >
                        Kick
                    </button>
                </td>
            </tr>
        ))}
    </tbody>
</table>

            {userToBan && (
                <div>
                    <h3>Banează utilizator</h3>
                    <input
                        type="text"
                        placeholder="Motivul banării"
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                    />
                    <button onClick={handleBan}>Confirmă</button>
                    <button onClick={() => setUserToBan(null)}>Anulează</button>
                </div>
            )}
        </div>
    );
}

export default Users;
