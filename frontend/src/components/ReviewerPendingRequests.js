import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";

function ReviewerPendingRequests() {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [exerciseDetails, setExerciseDetails] = useState(null);
    const [editingExercise, setEditingExercise] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null); //cererea curenta selectata

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

        if (!selectedRequest || !selectedRequest.id) {
            alert("No selected request for approval.");
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
                            Options (separated by commas):
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
                           Correct option (index begin with 0):
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
                       Correct answer:
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
        <>
            <h2>Pending Requests</h2>
            <div className="requests-list">
                {requests.map((request) => (
                    <div key={request.id} className="request-card">
                        <p><b>Exercise ID:</b> {request.exercise_id}</p>
                        <p><b>User message:</b> {request.message}</p>
                        <div className="request-buttons">
                            <button
                                className="accent-btn"
                                onClick={() => {
                                    if (selectedRequest?.id === request.id) {
                                        setSelectedRequest(null);
                                        setExerciseDetails(null);
                                    } else {
                                        setSelectedRequest(request);
                                        fetchExerciseDetails(request.exercise_id);
                                    }
                                }}
                            >
                                {selectedRequest?.id === request.id ? "Hide Details" : "Details"}
                            </button>
                            <button
                                className="accent-btn reject-btn"
                                onClick={() => handleReject(request)}
                            >
                                Reject
                            </button>
                        </div>

                        {selectedRequest?.id === request.id && exerciseDetails && (
                            <div className="exercise-details">
                                <h3>Exercise details</h3>
                                <p><b>Question:</b> {exerciseDetails.question}</p>
                                <p><b>Correct answer:</b> {exerciseDetails.correct_answer || exerciseDetails.options?.[exerciseDetails.correct_option]}</p>
                                <button
                                    className="accent-btn"
                                    onClick={() => setEditingExercise(exerciseDetails)}
                                >
                                    Edit
                                </button>

                                {/* Formularul de editare apare aici */}
                                {editingExercise?.id === exerciseDetails.id && (
                    <div className="edit-form">
                        <h3>Edit exercise</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleEditExercise();
                            }}
                        >
                            <label>
                               Question:
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
                                Difficulty:
                                <select
                                    value={editingExercise.difficulty || "easy"}
                                    onChange={(e) =>
                                        setEditingExercise({
                                            ...editingExercise,
                                            difficulty: e.target.value,
                                        })
                                    }
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </label>
                            {renderTypeSpecificFields(editingExercise, setEditingExercise)}
                            <div className="button-container">
                                <button type="submit" className="accent-btn save-btn">Save</button>
                                <button className="accent-btn approve-btn" onClick={handleApprove}>
                                    Approve
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}


export default ReviewerPendingRequests;
