import api from "../api";
import { AuthContext } from "../App";
import React, { useState, useEffect, useContext } from "react";
import ProfilePicture from "./ProfilePicture";

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

    });

    const handleBan = async (user_id) => {
        try {
            const response = await api.post("/admin/ban_user", { user_id: user_id, reason: "..."});

            if (response.data.status === "success") {
                fetchUsers();
            }
        }
        catch (error) {
            console.log("Error banning user:", error);
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
                        <td align="center">{index + 1}</td>
                        {user.role === "admin" && <td align="center">{u.email}</td>}
                        <td style={{ width: "100%" }}>
                            <div className="user">
                                {u.is_banned ? <div className="banned">Banned</div> : <div className="level">Level {Math.floor(u.xp / 100)}</div>}
                                <ProfilePicture user_id={u.id}/>
                                <div className="name">{u.username}</div>
                                <div className="email">({u.xp})</div>
                            </div>
                        </td>
                        {user.role === "admin" &&
                            <td align="center">
                                <div className="review-buttons">
                                    <button className="btn" onClick={() => handleKick(u.id)} disabled={u.role === "admin"}>Kick</button>
                                    {u.is_banned 
                                    ? <button className="btn" onClick={() => handleUnban(u.id)}>Unban</button> 
                                    : <button className="btn" onClick={() => handleBan(u.id)} disabled={u.role === "admin"}>Ban</button>}
                                </div>
                            </td>
                        }
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default Leaderboard;