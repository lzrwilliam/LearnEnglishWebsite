import React, { useEffect, useState } from "react";
import api from "../api";

function Admin() {
  const [exercises, setExercises] = useState([]);
  const [message, setMessage] = useState("");


  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await api.get("/admin/exercises");
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







  return (
    <div className="admin-page">
      <h2>Admin - Lista Exercițiilor</h2>
      {message && <p className="message">{message}</p>}
      
    
      <table className="exercise-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Întrebare</th>
            <th>Dificultate</th>
            <th>Tip</th>
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
            
              </tr>
            ))}
        </tbody>
      </table>
     
    </div>
  );
}

export default Admin;
