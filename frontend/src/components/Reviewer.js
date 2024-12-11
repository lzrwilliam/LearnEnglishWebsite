import React, { useEffect, useState } from "react";
import api from "../api";

function Reviewer() {
  const [exercises, setExercises] = useState([]);
  const [message, setMessage] = useState("");
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
        const validExercises = response.data.exercises.filter(
          (exercise) => exercise && exercise.id
        ); // Filter valid exercises
        setExercises(validExercises);
      } catch (error) {
        setMessage("Eroare la încărcarea exercițiilor.");
      }
    };
    fetchExercises();
  }, []);

  const handleDelete = async (exerciseId) => {
    const confirmDelete = window.confirm("Ești sigur că vrei să ștergi acest exercițiu?");
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/reviewer/exercises/${exerciseId}`);
      if (response.data.status === "success") {
        setExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
        setMessage("Exercițiul a fost șters cu succes.");
      }
    } catch (error) {
      setMessage("Eroare la ștergerea exercițiului.");
    }
  };

  const handleAddExercise = async () => {
    try {
      const response = await api.post("/reviewer/exercises", newExercise);
      if (response.data.status === "success") {
        const validExercise = response.data.exercise;
        setExercises((prev) => [...prev, validExercise]);
        setMessage("Exercițiul a fost adăugat cu succes.");
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
      setMessage("Eroare la adăugarea exercițiului.");
    }
  };

  const handleEditClick = (exercise) => {
    console.log("Exercițiul selectat pentru editare:", exercise); // Debug
    if (!exercise || !exercise.id) {
      setMessage("Eroare: Exercițiul selectat nu este valid.");
      return;
    }
    setEditingExercise({ ...exercise });
  };

  const handleEditExercise = async () => {
    try {
        const response = await api.put(`/reviewer/exercises/${editingExercise.id}`, editingExercise);
        if (response.data.status === "success") {
            setMessage("Exercițiul a fost actualizat cu succes."); // Display success message
            setEditingExercise(null); // Close the editing form

            // Refresh the page to reload all exercises
            window.location.reload();
        } else {
            setMessage("Eroare la actualizarea exercițiului."); // Handle unsuccessful update
        }
    } catch (error) {
        setMessage("Eroare la actualizarea exercițiului."); // Handle API errors
        console.error("Error updating exercise:", error); // Log error for debugging
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
                required
              />
            </label>
            <label>
              Opțiunea corectă (index incepe cu 0):
              <input
                type="number"
                value={exercise.correct_option || ""}
                onChange={(e) =>
                  setExercise({
                    ...exercise,
                    correct_option: parseInt(e.target.value, 10),
                  })
                }
                required
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
              required
            />
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div className="reviewer-page">
      <h2>Reviewer - Lista Exercițiilor</h2>
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
          {exercises
            .filter((exercise) => exercise && exercise.id) // Ensure valid objects
            .map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.id}</td>
                <td>{exercise.question}</td>
                <td>{exercise.difficulty}</td>
                <td>{exercise.type}</td>
                <td>
                  <div className="buttons">
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      🗑️ Șterge
                    </button>
                    <button
                      className="edit-button"
                      onClick={() => handleEditClick(exercise)}
                    >
                      ✏️ Editare
                    </button>
                  </div>
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
            <button type="submit" className="save-button">
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