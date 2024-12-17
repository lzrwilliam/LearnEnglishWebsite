import api from "../api";
import { AuthContext } from "../App";
import React, { useState, useEffect, useContext } from "react";

function Leaderboard() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const response = await api.get(`/leaderboard?user_id=${user.id}`);

            setUsers(response.data.leaderboard);

        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        }
    };

    useEffect(() => {

        fetchUsers();

    }, [user]);

    const handleBan = async (user_id) => {
        try {
            const response = await api.post("/admin/ban_user", { user_id: user_id, reason: "..."});

            if (response.data.status === "success") {
                fetchUsers();
            }
        }
        catch (error) {
            console.log("Eroare la banarea utilizatorului:", error);
        }
    };

    const handleUnban = async (userId) => {
        try {
            const response = await api.post("/admin/unban_user", { user_id: userId });
            if (response.data.status === "success") {
                fetchUsers();
            }
        } catch (error) {
            console.error("Error unbanning user:", error);
        }
    };

    const handleKick = async (userId) => {
        const confirmed = window.confirm("Are you sure you want to kick this user?\nThis action cannot be undone.");

        if (!confirmed) return;

        try {
            const response = await api.delete(`/admin/kick_user?user_id=${userId}`);

            if (response.data.status === "success") {
               fetchUsers();
            }
        } catch (error) {
            console.error("Error kicking user:", error);
        }
    };

    return (
        <table className="table table-striped">
            <tbody>
                {users.map((u, index) => (
                    <tr key={u.id}>
                        <td align="center">
                            {u.is_banned ? <div className="banned">Banned</div> : <div className="level">Level {Math.floor(u.xp / 100)}</div>}
                        </td>
                        <td style={{width: "100%"}}>
                            <div className="user">
                                <div className="pfp"/>
                                <div className="name">{u.username}</div>
                                {user.role === "admin" && <div className="email">&nbsp;({u.email})</div>}
                            </div>
                        </td>

                        {user.role === "admin" &&
                            <td align="center">
                                {u.role != "admin" &&
                                    <div className="review-buttons">
                                        <button className="btn" onClick={() => handleKick(u.id)}>Kick</button>
                                        {u.is_banned 
                                        ? <button className="btn" onClick={() => handleUnban(u.id)}>Unban</button> 
                                        : <button className="btn" onClick={() => handleBan(u.id)}>Ban</button>}
                                    </div>
                                }
                            </td>
                        }
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default Leaderboard;