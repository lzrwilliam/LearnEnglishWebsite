import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";

function Users() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [banReason, setBanReason] = useState("");
    const [userToBan, setUserToBan] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState("");

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

    const handleRoleSelection = (userId, role) => {
        setSelectedUser(userId);
        setSelectedRole(role);
    };

    const handleConfirmRoleChange = async () => {
        if (!selectedUser || !selectedRole) {
            setMessage("Selectați un utilizator și un rol pentru a confirma schimbarea.");
            return;
        }

        try {
            const response = await api.post("/admin/update_role", {
                user_id: selectedUser,
                new_role: selectedRole,
            });

            if (response.data.status === "success") {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === selectedUser ? { ...u, role: selectedRole } : u
                    )
                );
                setMessage(response.data.message);
                setSelectedUser(null);
                setSelectedRole("");
            }
        } catch (error) {
            setMessage("Eroare la schimbarea rolului.");
        }
    };
    const handleCancelRoleChange = () => {
        setSelectedUser(null);
        setSelectedRole("");
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

//     return (
//         <div className="users-page">
//             <h2>Admin - Gestionare Utilizatori</h2>
//             {message && <p>{message}</p>}
//             <table>
//     <thead>
//         <tr>
//             <th>ID</th>
//             <th>Username</th>
//             <th>Email</th>
//             <th>Rol</th>
//             <th>XP</th> {/* Change this */}
//             <th>Stare</th>
//             <th>Acțiuni</th>
//         </tr>
//     </thead>
//     <tbody>
//         {users.map((u) => (
//             <tr key={u.id}>
//                 <td>{u.id}</td>
//                 <td>{u.username}</td>
//                 <td>{u.email}</td>
//                 <td>{u.role}</td>
//                 <td>{u.xp || 0}</td> {/* Display XP here */}
//                 <td>{u.is_banned ? "Banat" : "Activ"}</td>
//                 <td>
//                     {u.id !== user.id && u.is_banned && (
//                         <button className="unban-btn" onClick={() => handleUnban(u.id)}>Unban</button>
//                     )}

//                     {u.id !== user.id && !u.is_banned && (
//                         <button className="ban-btn" onClick={() => {setUserToBan(u.id); setBanReason("");}}>Ban</button>
//                     )}

//                     {u.id !== user.id && (
//                         <button className="kick-btn" onClick={() => handleKick(u.id)}>Kick</button>
//                     )}

// {u.id !== user.id && (
//                                        <select
//                                        className="role-dropdown"
//                                        value={selectedUser === u.id ? selectedRole : ""}
//                                        onChange={(e) => handleRoleSelection(u.id, e.target.value)}
//                                    >
//                                        <option value="" disabled>
//                                            Selectați un rol
//                                        </option>
//                                        {["user", "reviewer", "admin"]
//                                            .filter((role) => role !== u.role) // Excludem rolul curent al utilizatorului
//                                            .map((role) => (
//                                                <option key={role} value={role}>
//                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
//                                                </option>
//                                            ))}
//                                    </select>
//                                     )}

                    
//                 </td>
               
//             </tr>
//         ))}
//     </tbody>
// </table>

// {selectedUser && selectedRole && (
//                 <div className="confirmation-section">
//                     <p>
//                         Sunteți sigur că doriți să schimbați rolul utilizatorului{" "}
//                         <strong>{selectedUser}</strong> la <strong>{selectedRole}</strong>?
//                     </p>
//                     <button className="confirm-btn" onClick={handleConfirmRoleChange}>
//                         Confirmă
//                     </button>
//                     <button className="cancel-btn" onClick={handleCancelRoleChange}>
//                         Anulează
//                     </button>
//                 </div>
//             )}

//             {userToBan && (
//                 <div>
//                     <h3>Banează utilizator</h3>
//                     <input
//                         type="text"
//                         placeholder="Motivul banării"
//                         value={banReason}
//                         onChange={(e) => setBanReason(e.target.value)}
//                     />
//                     <button onClick={handleBan}>Confirmă</button>
//                     <button onClick={() => setUserToBan(null)}>Anulează</button>
//                 </div>
//             )}
//         </div>
//     );

    return (
        <table>
            <tbody>
                {users.map((u) => (
                    <tr>
                        <td>
                            <div className="pula">
                                <p className="level">Level {Math.floor(u.xp / 100)}</p>
                                <td><div className="pfp"></div></td>
                                {u.username}
                                {u.is_banned && <p className="banned">Banned</p>}
                            </div>
                        </td>
                        <td>
                        </td>
                        <td>{u.email}</td>
                        <td>
                            <select className="role-select">
                                <option value="user">User</option>
                                <option value="reviewer">Reviewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </td>
                        <td>
                            <button className="ban-btn">Ban</button>
                            <button className="kick-btn">Kick</button>
                        </td>
                    </tr>  
                ))}
            </tbody>
        </table>
    );
}

export default Users;
