import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";

function ReviewerPendingRequests() {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [exerciseDetails, setExerciseDetails] = useState(null);
    const [editingExercise, setEditingExercise] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    const fetchRequests = async () => {
        try {
            const response = await api.get("/reviewer_requests");
            setRequests(response.data.requests);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
        }
    };

    const fetchExerciseDetails = async (exerciseId) => {
        try {
            const response = await api.get(`/reviewer/exercises/${exerciseId}`);
            setExerciseDetails(response.data.exercise);
        } catch (error) {
            console.error("Error fetching exercise details:", error);
        }
    };

    const handleApprove = async () => {
        if (!isSaved) {
            alert("You must save the changes before approve!");
            return;
        }

        if (!selectedRequest) {
            alert("No selected request for approve.");
            return;
        }

        try {
            await api.post(`/reviewer_requests/${selectedRequest.id}`, {
                action: "approve",
                reviewer_id: user.id,
            });
            fetchRequests();
            alert("Request has been approved!");
            setExerciseDetails(null);
            setEditingExercise(null);
            setSelectedRequest(null);
            setIsSaved(false);
        } catch (error) {
            console.error("Error approving request:", error);
        }
    };

    const handleReject = async (request) => {
        try {
            await api.post(`/reviewer_requests/${request.id}`, {
                action: "reject",
                reviewer_id: user.id,
            });
            fetchRequests();
            alert("Request has been rejected!");
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };

    const handleEditExercise = async () => {
        try {
            await api.put(`/reviewer/exercises/${editingExercise.id}`, editingExercise);
            alert("Exercise has been updated succesfully!");
            setIsSaved(true);
        } catch (error) {
            console.error("Error updating exercise:", error);
        }
    };

    const renderTypeSpecificFields = (exercise, setExercise) => {
        if (!exercise) return null;

        switch (exercise.type) {
            case "fill_blank":
            case "multiple_choice":
                return (
                    <>
                        <label>
                            Opțiuni (separate prin virgulă):
                            <input
                                type="text"
                                value={exercise.options?.join(",") || ""}
                                onChange={(e) =>
                                    setExercise({
                                        ...exercise,
                                        options: e.target.value.split(","),
                                    })
                                }
                            />
                        </label>
                        <label>
                            Opțiunea corectă (index începe cu 0):
                            <input
                                type="number"
                                value={exercise.correct_option || ""}
                                onChange={(e) =>
                                    setExercise({
                                        ...exercise,
                                        correct_option: parseInt(e.target.value, 10),
                                    })
                                }
                            />
                        </label>
                    </>
                );
            case "rearrange":
                return (
                    <label>
                        Răspuns corect:
                        <input
                            type="text"
                            value={exercise.correct_answer || ""}
                            onChange={(e) =>
                                setExercise({
                                    ...exercise,
                                    correct_answer: e.target.value,
                                    options: e.target.value.split(" ").sort(() => Math.random() - 0.5),
                                })
                            }
                        />
                    </label>
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div>
            <h2>Pending Requests</h2>
            {requests.map((request) => (
                <div key={request.id} className="request-item">
                    <p><b>Exercițiul ID:</b> {request.exercise_id}</p>
                    <p><b>Mesaj utilizator:</b> {request.message}</p>
                    <button onClick={() => {
                        fetchExerciseDetails(request.exercise_id);
                        setSelectedRequest(request);
                    }}>Detalii</button>
                    <button onClick={() => handleReject(request)}>Respinge</button>
                </div>
            ))}

            {exerciseDetails && (
                <div>
                    <h3>Detalii Exercițiu</h3>
                    <p><b>Întrebare:</b> {exerciseDetails.question}</p>
                    <p><b>Răspuns corect:</b> {exerciseDetails.correct_answer || exerciseDetails.options?.[exerciseDetails.correct_option]}</p>
                    <button onClick={() => {
                        setEditingExercise(exerciseDetails);
                        setIsSaved(false);
                    }}>Editare</button>
                </div>
            )}

            {editingExercise && (
                <div className="edit-form">
                    <h3>Editare Exercițiu</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleEditExercise();
                        }}
                    >
                        <label>
                            Întrebare:
                            <input
                                type="text"
                                value={editingExercise.question || ""}
                                onChange={(e) =>
                                    setEditingExercise({
                                        ...editingExercise,
                                        question: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <label>
                            Dificultate:
                            <select
                                value={editingExercise.difficulty || "easy"}
                                onChange={(e) =>
                                    setEditingExercise({
                                        ...editingExercise,
                                        difficulty: e.target.value,
                                    })
                                }
                            >
                                <option value="easy">Ușor</option>
                                <option value="medium">Mediu</option>
                                <option value="hard">Greu</option>
                            </select>
                        </label>
                        <label>
                            Tip Exercițiu:
                            <select
                                value={editingExercise.type || "fill_blank"}
                                onChange={(e) =>
                                    setEditingExercise({
                                        ...editingExercise,
                                        type: e.target.value,
                                    })
                                }
                            >
                                <option value="fill_blank">Completare spațiu</option>
                                <option value="multiple_choice">Alegere multiplă</option>
                                <option value="rearrange">Rearanjare</option>
                            </select>
                        </label>
                        {renderTypeSpecificFields(editingExercise, setEditingExercise)}
                        <button type="submit">Save</button>
                    </form>
                    <button onClick={handleApprove}>Approve</button>
                </div>
            )}
        </div>
    );
}

export default ReviewerPendingRequests;
