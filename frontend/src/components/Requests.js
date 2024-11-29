import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import "../styles/Requests.css";
import { AuthContext } from "../App";


function Requests() {
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState("");
    const [reviewers, setReviewers] = useState({}); // Map of reviewer_id to reviewer names
    const { user } = useContext(AuthContext);



    // Mapping of database field names to user-friendly labels
    const fieldLabels = {
        question: "Întrebare",
        options: "Opțiuni",
        correct_option: "Opțiunea corectă (index)",
        correct_answer: "Răspuns corect",
        difficulty: "Dificultate",
        type: "Tip Exercițiu",
    };

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await api.get("/admin/requests");
                setRequests(response.data.requests);
            } catch (error) {
                setMessage("Eroare la încărcarea solicitărilor.");
            }
        };

        const fetchReviewers = async () => {
            try {
                const response = await api.get(`/admin/users?admin_id=${user.id}`);
                const reviewersMap = {};
                response.data.users.forEach(user => {
                    reviewersMap[user.id] = user.username;
                });
                setReviewers(reviewersMap);
            } catch (error) {
                setMessage("Eroare la încărcarea utilizatorilor.");
            }
        };

        fetchRequests();
        fetchReviewers();
    }, []);


    const renderExerciseDetails = (exercise) => {
        return Object.keys(exercise).map((key) => {
            const value = exercise[key];
            if (value === null || value === undefined || value === "") {
                return null; // Nu afișa câmpurile nule/goale
            }
    
            if (key === "options" && Array.isArray(value)) {
                return (
                    <p key={key}>
                        <strong>{fieldLabels[key] || key}:</strong> {value.join(", ")}
                    </p>
                );
            }
    
            return (
                <p key={key}>
                    <strong>{fieldLabels[key] || key}:</strong> {value}
                </p>
            );
        });
    };
    
    const handleApprove = async (requestId) => {
        try {
            const response = await api.post(`/admin/requests/${requestId}/approve`);
            setMessage(response.data.message);
            setRequests((prev) => prev.filter((req) => req.id !== requestId));
        } catch (error) {
            setMessage("Eroare la aprobarea solicitării.");
        }
    };

    const handleReject = async (requestId) => {
        try {
            const response = await api.post(`/admin/requests/${requestId}/reject`);
            setMessage(response.data.message);
            setRequests((prev) => prev.filter((req) => req.id !== requestId));
        } catch (error) {
            setMessage("Eroare la respingerea solicitării.");
        }
    };

    const renderComparison = (original, proposed) => {
        const keys = Object.keys(proposed);
        return keys.map((key) => {
            if (key === "options" && proposed.type === "rearrange") {
                return null;
            }
           let originalValue = original[key] || "N/A";
          let proposedValue = proposed[key] || "N/A";

   
            if (key === "options") {
                if (Array.isArray(originalValue)) {
                    originalValue = originalValue.join(", ");
                }
                if (Array.isArray(proposedValue)) {
                    proposedValue = proposedValue.join(", ");
                }
            }

            if (originalValue === "N/A" && proposedValue === "N/A") return null; // Skip irrelevant fields

            return (
                <div className="comparison-row" key={key}>
                    <div className="comparison-key">{fieldLabels[key] || key}:</div>
                    <div className={`comparison-value ${originalValue === proposedValue ? "" : "changed"}`}>
                        Original: {originalValue}
                    </div>
                    <div className={`comparison-value ${originalValue === proposedValue ? "" : "changed"}`}>
                        Propus: {proposedValue}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="requests-page">
            <h2>Solicitări Admin</h2>
            {message && <p className="message">{message}</p>}
            {requests.length === 0 ? (
                <p>Nu există solicitări în așteptare.</p>
            ) : (
                requests.map((request) => (
                    <div className="request-card" key={request.id}>
                        <h3>Solicitare #{request.id}</h3>
                        <p><strong>Reviewer ID:</strong> {request.reviewer_id} ({reviewers[request.reviewer_id] || "N/A"})</p>
                        <p><strong>Tip solicitare:</strong> {request.request_type}</p>
                        {request.request_type === "edit" && (
                            <div className="comparison">
                                <h4>Comparație:</h4>
                                {renderComparison(request.exercise_data.original, request.exercise_data.proposed)}
                            </div>
                        )}
                        {request.request_type === "add" && (
                            <div>
                                <h4>Exercițiu Propus:</h4>
                                {Object.keys(request.exercise_data).map((key) => (
                                     request.exercise_data.type === "rearrange" && key === "options"
                                     ? null
                                     : request.exercise_data[key] && ( // Skip irrelevant fields
                                        <p key={key}>
                                            <strong>{fieldLabels[key] || key}:</strong> {key === "options" && Array.isArray(request.exercise_data[key])
    ? request.exercise_data[key].join(", ")
    : request.exercise_data[key]}

                                        </p>
                                    )
                                ))}
                            </div>
                        )}
                        {request.request_type === "delete" && (
                           
                           <div>
                                <h4>Detalii Exercițiu:</h4>
                                {renderExerciseDetails(request.exercise_data)}
                            </div>
                        )}
                        <div className="actions">
                            <button onClick={() => handleApprove(request.id)} className="approve-button">
                                Aprobați
                            </button>
                            <button onClick={() => handleReject(request.id)} className="reject-button">
                                Respingeți
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default Requests;
