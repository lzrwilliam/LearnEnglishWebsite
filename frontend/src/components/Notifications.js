import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";

function UserNotifications() {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [message, setMessage] = useState("");

    const fetchNotifications = async () => {
        try {
            const response = await api.get(`/notifications/${user.id}`);
            setNotifications(response.data.notifications);
        } catch (error) {
            setMessage("Error loading notifications!.");
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}`, { is_read: true });
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === notificationId ? { ...notif, is_read: true } : notif
                )
            );
        } catch (error) {
            setMessage("Eroare la marcarea notificării ca citită.");
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications((prev) =>
                prev.filter((notif) => notif.id !== notificationId)
            );
        } catch (error) {
            setMessage("Eroare la ștergerea notificării.");
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div>
            <h2>🔔 Notifications</h2>
            {message && <p className="error-message">{message}</p>}
            {notifications.length === 0 && <p>No available notifications.</p>}
            <ul className="notifications-list">
                {notifications.map((notif) => (
                    <li
                        key={notif.id}
                        className={`notification-item ${
                        
                            notif.is_read ? "read" : "unread"
                        }`}
                    >
                        <p>{notif.message}
                      

                        </p>
                        <p><small>{new Date(notif.created_at).toLocaleString()}</small></p>
                        <div className="actions">
                            {!notif.is_read && <button onClick={() => markAsRead(notif.id)}>✔ Mark as read</button>}
                            <button onClick={() => deleteNotification(notif.id)}>🗑️ Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserNotifications;
