import React, { useState, useEffect } from "react";
import api from "../api";

function AdminRequests() {
    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        try {
            const response = await api.get("/admin/role_requests");
            setRequests(response.data.requests);
        } catch (error) {
            console.error("Failed to fetch role requests:", error);
        }
    };

    const handleAction = async (requestId, action) => {
        try {
            await api.put(`/admin/role_requests/${requestId}`, { action });
            fetchRequests();
        } catch (error) {
            console.error("Failed to update request:", error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div>
            <h1>Role Requests</h1>
            <ul>
                {requests.map((req) => (
                    <li key={req.id}>
                        <strong>{req.username}</strong> requested role: {req.role_requested}{" "}
                        <button onClick={() => handleAction(req.id, "approve")}>Approve</button>
                        <button onClick={() => handleAction(req.id, "reject")}>Reject</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AdminRequests;
