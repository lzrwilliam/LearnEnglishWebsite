import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/Reviewer.css";

function Reviewer() {
    const [exercises, setExercises] = useState([]);
    const [message, setMessage] = useState("");
    const [editingExercise, setEditingExercise] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

    
    const [newExercise, setNewExercise] = useState({
        question: "",
        options: [],
        correct_option: null,
        correct_answer: "",
        type: "fill_blank",
        difficulty: "easy",
    });

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const response = await api.get("/reviewer/exercises");
                setExercises(response.data.exercises);
            } catch (error) {
                setMessage("Eroare la încărcarea exercițiilor.");
            }
        };
        fetchExercises();
    }, []);

    const handleRequest = async (requestType, exerciseData) => {
        const reviewerId = JSON.parse(localStorage.getItem("user"))?.id;
        if (!reviewerId) {
            setMessage("Eroare: Utilizatorul nu este autentificat.");
            return;
        }
       
        if (isActionPending(exerciseData.id, requestType)) {
            window.alert(
                `Nu puteti trimite o alta solicitare de ${requestType} pentru acest exercitiu deoarece exista deja una in asteptare.`
            );
            return;
        }
    
        try {
            const response = await api.post("/reviewer/requests", {
                reviewer_id: reviewerId,
                request_type: requestType,
                exercise_data: exerciseData,
            });

              // Update pending requests immediately
              setPendingRequests((prev) => [
                ...prev,
                {
                    reviewer_id: reviewerId,
                    request_type: requestType,
                    exerciseData,
                    status: "pending",
                },
            ]);
            setMessage(response.data.message || "Solicitarea a fost trimisă.");
            window.alert(response.data.message || "Solicitarea a fost trimisă cu succes!");
            setEditingExercise(null);
            window.location.reload();

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setMessage(error.response.data.message); // Show backend error message
            } else {
                setMessage("Eroare la trimiterea solicitării.");
            }
        }
    };
    



    useEffect(() => {
        const fetchPendingRequests = async () => {
            const reviewerId = JSON.parse(localStorage.getItem("user"))?.id;
            if (!reviewerId) {
                setMessage("Eroare: Utilizatorul nu este autentificat.");
                return;
            }
    
            try {
                const response = await api.get(`/reviewer/requests?reviewer_id=${reviewerId}`);
                setPendingRequests(response.data.requests || []);
            } catch (error) {
                setMessage("Eroare la încărcarea solicitărilor pendinte.");
            }
        };
    
        fetchPendingRequests();
    }, []);
    

    const isActionPending = (exerciseId, requestType) => {
        return pendingRequests.some(
            (req) => req.exercise_data.id === exerciseId && req.request_type === requestType && req.status === "pending"
        );
    };
    


    const handleAddExercise = () => {
        handleRequest("add", newExercise);
        setNewExercise({
            question: "",
            options: [],
            correct_option: null,
            correct_answer: "",
            type: "fill_blank",
            difficulty: "easy",
        });
    };

    const handleEditExercise = () => {
        if (editingExercise) {
            handleRequest("edit", editingExercise);
        }
    };

    const handleDeleteExercise = (exerciseId) => {
        handleRequest("delete", { id: exerciseId });
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

    return (
        <div className="reviewer-page">
            <h2>Exerciții - Reviewer</h2>
            {message && <p className="message">{message}</p>}
            <button className="add-button" onClick={() => setShowForm(true)}>
                ➕ Adaugă Exercițiu
            </button>
            {showForm && (
                <div className="form-container">
                    <h3>Adaugă un Exercițiu</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAddExercise();
                        }}
                    >
                        <label>
                            Întrebare:
                            <input
                                type="text"
                                value={newExercise.question}
                                onChange={(e) =>
                                    setNewExercise({ ...newExercise, question: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Dificultate:
                            <select
                                value={newExercise.difficulty}
                                onChange={(e) =>
                                    setNewExercise({ ...newExercise, difficulty: e.target.value })
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
                                value={newExercise.type}
                                onChange={(e) =>
                                    setNewExercise({ ...newExercise, type: e.target.value })
                                }
                            >
                                <option value="fill_blank">Completare spațiu</option>
                                <option value="multiple_choice">Alegere multiplă</option>
                                <option value="rearrange">Rearanjare</option>
                            </select>
                        </label>
                        {renderTypeSpecificFields(newExercise, setNewExercise)}
                        <button type="submit" className="save-button">
                            Salvează
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => setShowForm(false)}
                        >
                            Anulează
                        </button>
                    </form>
                </div>
            )}
            <table className="exercise-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Întrebare</th>
                        <th>Dificultate</th>
                        <th>Tip</th>
                        <th>Acțiuni</th>
                    </tr>
                </thead>
                <tbody>
                    {exercises.map((exercise) => (
                        <tr key={exercise.id}>
                            <td>{exercise.id}</td>
                            <td>{exercise.question}</td>
                            <td>{exercise.difficulty}</td>
                            <td>{exercise.type}</td>
                            <td>
                                <button className="edit-button"  
                                onClick={() => {
                                    if (isActionPending(exercise.id, "edit")) {
                                        window.alert(
                                            "Există deja o solicitare de editare în așteptare pentru acest exercițiu."
                                        );
                                        return;
                                    }
                                    setEditingExercise(exercise);
                                }}
        >
                                    ✏️ Editare
                                </button>
                                <button className="delete-button"  onClick={() => handleRequest("delete", { id: exercise.id })}
         >
                                    🗑️ Șterge
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {editingExercise && (
                <div className="form-container">
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
                                required
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
                        <button type="submit" className="save-button"
                       
                        >
                            Salvează
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => setEditingExercise(null)}
                        >
                            Anulează
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Reviewer;
