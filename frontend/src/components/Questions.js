import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";
import "../styles/Questions.css";

function Questions() {
    const { user } = useContext(AuthContext);
    const [difficulty, setDifficulty] = useState("easy");
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState([]);
    const [answer, setAnswer] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [xp, setXp] = useState(0);
    const [dragItems, setDragItems] = useState([]); // Cuvintele plasate
    const [availableWords, setAvailableWords] = useState([]); // Cuvintele disponibile pentru drag-and-drop
    const [responses, setResponses] = useState({}); // Tracks responses and correctness


    const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

    const fetchQuestions = async () => {
        try {
            const response = await api.post("/questions", {
                user_id: user.id,
                difficulty,
                session_questions: sessionQuestions,
            });
            setQuestions(response.data.questions);
            setCurrentQuestion(0);
            setFeedback("");
            setAnswer(null); // Resetăm răspunsul
            setResponses({});


            setDragItems([]);
            setAvailableWords([]); // Resetăm pentru următoarea întrebare
        } catch (error) {
            console.error("Eroare la obținerea întrebărilor:", error);
        }
    };

    const submitAnswer = async () => {
        const question = questions[currentQuestion];
        let formattedAnswer = answer;

        if (question.type === "rearrange") {
            formattedAnswer = dragItems.join(" "); // Creăm propoziția din elementele drag-and-drop
        }
        
      
        try {
            const response = await api.post("/answer", {
                user_id: user.id,
                question_id: question.id,
                answer: formattedAnswer,
            });
            const isCorrect = response.data.correct;
            setFeedback(isCorrect ? "Corect!" : `Greșit! Răspuns corect: ${question.correct_answer}`);
            if (isCorrect) {
                setXp((prevXp) => prevXp + response.data.xp);
            }
           
            setSessionQuestions((prev) => [...prev, question.id]);
            setResponses((prev) => ({
                ...prev,
                [currentQuestion]: { correct: isCorrect, answer: formattedAnswer },
            }));
        } catch (error) {
            console.error("Eroare la trimiterea răspunsului:", error);
        }
    };

    const handleNext = () => {
        setFeedback("");
        setAnswer(null);
        setDragItems([]);
        setAvailableWords([]);
        setCurrentQuestion((prev) => (prev + 1) % questions.length);
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleDragStart = (e, word, source, index) => {
        e.dataTransfer.setData("word", word);
        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("index", index);
    };

    const handleDrop = (e, targetIndex = null, target = "dragItems") => {
        e.preventDefault();
        const word = e.dataTransfer.getData("word");
        const source = e.dataTransfer.getData("source");
        const index = parseInt(e.dataTransfer.getData("index"), 10);
    
        if (source === "dragItems" && target === "available") {
            // Mutăm cuvântul din zona de răspuns în lista disponibilă
            setDragItems((prev) => prev.filter((_, i) => i !== index));
            setAvailableWords((prev) => [...prev, word]); // Adăugăm în zona inițială
        } else if (source === "available" && target === "dragItems") {
            // Mutăm cuvântul din lista disponibilă în zona de răspuns
            setAvailableWords((prev) => prev.filter((_, i) => i !== index));
            if (targetIndex === null) {
                setDragItems((prev) => [...prev, word]); // Adăugăm la sfârșit
            } else {
                setDragItems((prev) => [
                    ...prev.slice(0, targetIndex),
                    word,
                    ...prev.slice(targetIndex),
                ]); // Inserăm la targetIndex
            }
        } else if (source === "dragItems" && target === "dragItems") {
            // Reordonăm elementele din zona de răspuns
            setDragItems((prev) => {
                const updatedDragItems = [...prev];
                const [movedWord] = updatedDragItems.splice(index, 1); // Scoatem elementul mutat
                updatedDragItems.splice(targetIndex, 0, movedWord); // Inserăm la targetIndex
                return updatedDragItems;
            });
        }
    };
    
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const renderQuestionIndicators = () => (
        <div className="indicators">
            {questions.map((_, index) => {
                const status = responses[index]?.correct; // Fetch the correctness for this question
                const className = status === true
                    ? "indicator correct"
                    : status === false
                    ? "indicator incorrect"
                    : "indicator blank"; // Set class based on the correctness
    
                return (
                    <div
                        key={index}
                        className={className}
                        onClick={() => setCurrentQuestion(index)} // Allow navigation to question
                    >
                        {index + 1}
                    </div>
                );
            })}
        </div>
    );
    


    const renderQuestionOptions = (question) => {
        if (question.type === "multiple_choice" || question.type === "fill_blank") {
            if (!Array.isArray(question.options)) {
                return <p>Eroare: Opțiunile nu sunt disponibile pentru această întrebare.</p>;
            }
            return (
                <ul className="options">
                    {question.options.map((option, index) => (
                        <li key={index}>
                            <label>
                                <input
                                    type="radio"
                                    value={String(index)} // Store index as string (modified)
                                    checked={answer === String(index)} // Compare answer as string (modified)
                                    onChange={(e) => setAnswer(e.target.value)} // Update answer as string (modified)
                                />
                                {option}
                            </label>
                        </li>
                    ))}
                </ul>
            );
        }

        if (question.type === "rearrange") {
            // Inițializăm cuvintele disponibile doar o singură dată
            if (availableWords.length === 0 && dragItems.length === 0) {
                const shuffledWords = shuffleArray(question.correct_answer.split(" "));
                setAvailableWords(shuffledWords);
            }

            return (
                <div className="rearrange-container">
                    <p className="instruction">Drag-and-drop pentru a rearanja propoziția:</p>
                    
                    {/* Available Words */}
                    <div
    className="drag-area available-words"
    onDrop={(e) => handleDrop(e, null, "available")} // Permite adăugarea înapoi
    onDragOver={handleDragOver}
>
    {availableWords.map((word, index) => (
        <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, word, "available", index)}
            className="drag-item"
        >
            {word}
        </div>
    ))}
</div>

                    
        
                    {/* Drop Zone */}
                    <div
                        className="drag-area answer-zone"
                        onDrop={(e) => handleDrop(e, dragItems.length, "dragItems")}
                        onDragOver={handleDragOver}
                    >
                        {dragItems.map((word, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, word, "dragItems", index)}
                                onDrop={(e) => handleDrop(e, index, "dragItems")}
                                onDragOver={handleDragOver}
                                className="drag-item"
                            >
                                {word}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return <p>Tipul întrebării nu este suportat sau opțiunile lipsesc.</p>;
    };

    return (
        <div className="container">
        <h2>Exerciții</h2>
        <label htmlFor="difficulty">Selectează dificultatea:</label>
        <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
        >
            <option value="easy">Ușor</option>
            <option value="medium">Mediu</option>
            <option value="hard">Greu</option>
        </select>
        <button onClick={fetchQuestions}>Încarcă întrebări</button>
        <p>XP: {xp}</p>
        {questions.length > 0 && (
            <>
                {renderQuestionIndicators()}
                <div>
                    <p>{questions[currentQuestion].question}</p>
                    {renderQuestionOptions(questions[currentQuestion])}
                    <div className="actions">
                        <button onClick={submitAnswer}>Trimite răspunsul</button>
                        <button onClick={handlePrevious} disabled={currentQuestion === 0}>
                            Întrebarea anterioară
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentQuestion === questions.length - 1}
                        >
                            Întrebarea următoare
                        </button>
                    </div>
                    {feedback && <p className={`feedback ${feedback.includes("Corect") ? "correct" : "incorrect"}`}>{feedback}</p>}
                </div>
            </>
        )}
    </div>
    
    );
}

export default Questions;
