import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../App";

function Questions({updateXp}) {
    const { user } = useContext(AuthContext);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState([]);
    const [answer, setAnswer] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [dragItems, setDragItems] = useState([]); // Words placed in drag-and-drop
    const [availableWords, setAvailableWords] = useState([]); // Available words for drag-and-drop
    const [responses, setResponses] = useState({}); // Tracks responses and correctness

    const [userResponses, setUserResponses] = useState({}); // sa mentinem raspunsurile utilizatorului la intrb raspunse cand navigheaza prin intrebari

    const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

    const fetchQuestions = async () => {
        try {
            const response = await api.post("/questions", {
                user_id: user.id,
                difficulty: user.difficulty, // Use the user's difficulty level
                session_questions: sessionQuestions,
            });
            setQuestions(response.data.questions);
            setCurrentQuestion(0);
            setFeedback("");
            setAnswer(null); // Reset answer
            setResponses({});
            setDragItems([]);
            setAvailableWords([]); // Reset for the next question
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    const submitAnswer = async () => {
        const question = questions[currentQuestion];

        if (responses[currentQuestion]?.submitted) {
            setFeedback("Ai răspuns deja la această întrebare.");
            return;
        }
        let formattedAnswer = answer;

        if (question.type === "rearrange") {
            formattedAnswer = dragItems.join(" "); // Create the sentence from drag-and-drop items
        }

        try {
            const response = await api.post("/answer", {
                user_id: user.id,
                question_id: question.id,
                answer: formattedAnswer,
            });
            const isCorrect = response.data.correct;
            const correctAnswer =
                question.type === "fill_blank"
                    ? question.options[question.correct_option]
                    : question.correct_answer;
            setFeedback(
                isCorrect
                    ? "Correct!"
                    : `Incorrect! Correct answer: ${correctAnswer}`
            );

            updateXp(response.data.user_xp);

            setSessionQuestions((prev) => [...prev, question.id]);
            setResponses((prev) => ({
                ...prev,
                [currentQuestion]: { correct: isCorrect, answer: formattedAnswer , submitted: true},
            }));
            setUserResponses((prev) => ({
                ...prev,
                [question.id]: { answer: formattedAnswer, correct: isCorrect },
            }));
        } catch (error) {
            console.error("Error submitting answer:", error);
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
            setFeedback("");

        }
    };

    const handleDragStart = (e, word, source, index) => {
        const isAnswered = responses[currentQuestion]?.submitted;

        if (isAnswered) {
            return; 
        }
        e.dataTransfer.setData("word", word);
        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("index", index);
    };

    const handleDrop = (e, targetIndex = null, target = "dragItems") => {
        e.preventDefault();
        e.stopPropagation();
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
        const userResponse = userResponses[question.id];

        const isAnswered = responses[currentQuestion]?.submitted;

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
                                    value={String(index)} 
                                    checked={
                                        userResponse
                                            ? userResponse.answer === String(index)
                                            : answer === String(index)
                                    } 
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={isAnswered} 
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
            draggable={!isAnswered} // Permiterea tragerii doar daca intrebarea nu a fost raspunsa
            onDragStart={(e) => handleDragStart(e, word, "available", index)}
            className="drag-item"
        >
            {word}
        </div>
    ))}
</div>

                    
        
                    {/* Drop Zone */}
                    <br/>
                    <div
                        className="drag-area answer-zone"
                        onDrop={(e) => handleDrop(e, null, "dragItems")}
                        onDragOver={handleDragOver}
                    >
                        {dragItems.map((word, index) => (
                            <div
                                key={index}
                                draggable={!isAnswered}
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
        <>
            <div className="questions-start">
                <button onClick={fetchQuestions} className="accent-btn">Start</button>
            </div>

            { questions.length > 0  && (
                <div className="question">
                    <p>{questions[currentQuestion].question}</p>
                    {questions[currentQuestion].translation && (
                        <p className="translation">
                            {questions[currentQuestion].translation}
                        </p>
                    )}
                    {renderQuestionOptions(questions[currentQuestion])}
                    <div className="actions">
                        <button onClick={submitAnswer} className="accent-btn">Sumbit</button>
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                        >
                            Previous Question
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentQuestion === questions.length - 1}
                        >
                            Next Question
                        </button>
                    </div>
                    {feedback && (
                        <p
                            className={`feedback ${
                                feedback.includes("Correct") ? "correct" : "incorrect"
                            }`}
                        >
                            {feedback}
                        </p>
                    )}
                </div>
        )}
    </>
    );
    //     <div className="container">
    //         <h2>Exercises</h2>
    //         <button onClick={fetchQuestions} className="login-btn">Start</button>
    //         {questions.length > 0 && (
    //             <>
    //                 {renderQuestionIndicators()}
    //                 <div>
    //                     <p>{questions[currentQuestion].question}</p>
    //                     {questions[currentQuestion].translation && (
    //                         <p className="translation">
    //                             {questions[currentQuestion].translation}
    //                         </p>
    //                     )}
    //                     {renderQuestionOptions(questions[currentQuestion])}
    //                     <div className="actions">
    //                         <button onClick={submitAnswer}>Submit Answer</button>
    //                         <button
    //                             onClick={handlePrevious}
    //                             disabled={currentQuestion === 0}
    //                         >
    //                             Previous Question
    //                         </button>
    //                         <button
    //                             onClick={handleNext}
    //                             disabled={currentQuestion === questions.length - 1}
    //                         >
    //                             Next Question
    //                         </button>
    //                     </div>
    //                     {feedback && (
    //                         <p
    //                             className={`feedback ${
    //                                 feedback.includes("Correct") ? "correct" : "incorrect"
    //                             }`}
    //                         >
    //                             {feedback}
    //                         </p>
    //                     )}
    //                 </div>
    //             </>
    //         )}
    //     </div>
    // );
}

export default Questions;
