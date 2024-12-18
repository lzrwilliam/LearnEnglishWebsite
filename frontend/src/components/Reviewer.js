import React, { useEffect, useState } from "react";
import api from "../api";

function Reviewer() {
    const [exercises, setExercises] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);



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
                const validExercises = response.data.exercises.filter((exercise) => exercise && exercise.id);
                setExercises(validExercises);
            } catch (error) {
                console.error("Error fetching exercises:", error);
            }
        };

        fetchExercises();
    }, []);

    const handleDelete = async (exerciseId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this exercise?");

        if (!confirmDelete) 
            return;

        try {
            const response = await api.delete(`/reviewer/exercises/${exerciseId}`);

            if (response.data.status === "success")
                setExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
            
        } catch (error) {
            console.log("Error deleting exercise:", error);
        }
    };

    const handleAddExercise = async () => {
        try {
            const response = await api.post("/reviewer/exercises", newExercise);

            if (response.data.status === "success") {
                const validExercise = response.data.exercise;

                setExercises((prev) => [...prev, validExercise]);
                setShowForm(false);
                setNewExercise({
                    question: "",
                    options: [],
                    correct_option: null,
                    correct_answer: "",
                    type: "fill_blank",
                    difficulty: "easy",
                });
            }

        } catch (error) {
            console.log("Error adding exercise:", error);
        }
    };

    const handleEditClick = (exercise) => {

        if (!exercise || !exercise.id)
            return;
        
        setEditingExercise({ ...exercise });
    };

    const handleEditExercise = async () => {
        try {
            const response = await api.put(`/reviewer/exercises/${editingExercise.id}`, editingExercise);

            if (response.data.status === "success") {

                setExercises((prevExercises) =>
                    prevExercises.map((exercise) =>
                        exercise.id === editingExercise.id ? { ...editingExercise } : exercise
                    )
                );

                setEditingExercise(null);
            }

        } catch (error) {
            console.error("Error updating exercise:", error);
        }
    };

    const renderTypeSpecificFields = (exercise, setExercise) => {

        if (!exercise) 
            return null;

        switch (exercise.type) {
        case "fill_blank":
        case "multiple_choice":
            return (
            <>
                <label>Options (separateed by commas):</label>
                <input type="text" value={exercise.options?.join(",") || ""} required
                onChange={(e) =>
                    setExercise({
                        ...exercise,
                        options: e.target.value.split(","),
                    })
                    } />
                
                <label>Correct option (index begin with 0):</label>
                <input type="number" min="0" value={exercise.correct_option} required
                    onChange={(e) =>
                        setExercise({
                            ...exercise,
                            correct_option: parseInt(e.target.value, 10),
                        })
                    } />
            </>
            );
        case "rearrange":
            return (
                <>
                    <label>Correct answer:</label>
                    <input type="text" value={exercise.correct_answer || ""} required
                        onChange={(e) =>
                            setExercise({
                                ...exercise,
                                correct_answer: e.target.value,
                                options: e.target.value.split(" ").sort(() => Math.random() - 0.5),
                            })
                        } />
                </>
            );
        default:
            return null;
        }
    };

    return (
        <>
            <div class="questions-start">
                <button className="accent-btn" onClick={() => setShowForm(true)}>Add exercise</button>
            </div>

            {showForm && (
                <div className="overlay" onMouseDown={() => setShowForm(false)}>
                    <div className="form-container" onMouseDown={(e) => e.stopPropagation()}>
                        <h2>Add an exercise</h2>
                        <form onSubmit={(e) => {e.preventDefault(); handleAddExercise();}}>

                            <label>Întrebare:</label>  
                            <input type="text" value={newExercise.question} required
                                onChange={(e) =>
                                    setNewExercise({ ...newExercise, question: e.target.value })
                                } />
                            
                            <label>Difficulty:</label>
                            <select value={newExercise.difficulty}
                                onChange={(e) =>
                                    setNewExercise({ ...newExercise, difficulty: e.target.value })
                                } >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            
                            <label>Exercise type:</label>
                            <select value={newExercise.type}
                                onChange={(e) =>
                                    setNewExercise({ ...newExercise, type: e.target.value })
                                }>
                                <option value="fill_blank">Fill in the blank</option>
                                <option value="multiple_choice">Multiple choice</option>
                                <option value="rearrange">Rearrange</option>
                            </select>
                            
                            {renderTypeSpecificFields(newExercise, setNewExercise)}

                            <button type="submit" className="accent-btn">Salvează</button>

                        </form>
                    </div>
                </div>
            )}

            <table className="exercise-table">
                <tbody>
                    {exercises.filter((exercise) => exercise && exercise.id).map((exercise) => (
                        <tr>
                            <td align="right">{exercise.id}</td>
                            <td>{exercise.question}</td>
                            {/* <td align="center">{exercise.difficulty}</td>
                            <td align="center">{exercise.type}</td> */}
                            <td align="center" >
                                <div className="review-buttons">
                                    <button class="btn" onClick={() => handleEditClick(exercise)}>Edit</button>
                                    <button class="btn" onClick={() => handleDelete(exercise.id)}>Remove</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingExercise && (
                <div className="overlay" onMouseDown={() => setEditingExercise(null)}>
                    <div className="form-container" onMouseDown={(e) => e.stopPropagation()}>
                        <h2>Edit exercise</h2>
                        <form onSubmit={(e) => {e.preventDefault(); handleEditExercise();}}>

                            <label>Question:</label>
                            <input type="text" value={editingExercise.question || ""} required
                                onChange={(e) =>
                                    setEditingExercise({
                                        ...editingExercise,
                                        question: e.target.value,
                                    })
                                } />
                                
                            <label>Difficulty:</label>
                            <select value={editingExercise.difficulty || "easy"}
                                onChange={(e) =>
                                    setEditingExercise({
                                        ...editingExercise,
                                        difficulty: e.target.value,
                                    })
                                } >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            
                            <label>Exercise type:</label>
                            <select value={editingExercise.type || "fill_blank"} 
                                onChange={(e) =>
                                    setEditingExercise({
                                        ...editingExercise,
                                        type: e.target.value,
                                    })
                                }>
                                <option value="fill_blank">Fill in the blank</option>
                                <option value="multiple_choice">Multiple choice</option>
                                <option value="rearrange">Rearrange</option>
                            </select>
                            
                            {renderTypeSpecificFields(editingExercise, setEditingExercise)}

                            <button type="submit" className="accent-btn">Save</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Reviewer;