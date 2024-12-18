import React, { useState, useContext, useEffect } from "react";
import api from "../api";
import { AuthContext } from "../App";


function Questions({updateXp}) {
    const { user} = useContext(AuthContext); 
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState([]);
    const [answer, setAnswer] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [dragItems, setDragItems] = useState([]); // Words placed in drag-and-drop
    const [availableWords, setAvailableWords] = useState([]); // Available words for drag-and-drop
    const [responses, setResponses] = useState({}); // Tracks responses and correctness
    const [reportMessage, setReportMessage] = useState("");
    const [hasActiveRequest, setHasActiveRequest] = useState(false); // verifi daca user a facut cerere pt ex curent
    const [showReportBox, setShowReportBox] = useState(false); // sa afisam caseta text pt report la ex




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


    const checkActiveRequest = async () => {
        try {
            const exerciseId = questions[currentQuestion]?.id;
            if (!exerciseId) return;

            const response = await api.get(
                `/reviewer_requests?user_id=${user.id}&exercise_id=${exerciseId}`
            );
            setHasActiveRequest(response.data.hasActiveRequest);
        } catch (error) {
            console.error("Error checking active request:", error);
        }
    };

    // Trimiterea unei cereri de review
    const submitReport = async () => {
        if (!reportMessage.trim()) {
            setShowReportBox(false);
            return;
        }
        try {
            await api.post("/reviewer_requests", {
                user_id: user.id,
                exercise_id: questions[currentQuestion].id,
                message: reportMessage,
            });
            setReportMessage("");
            setHasActiveRequest(true); // Marchez cererea ca activă
            setShowReportBox(false);
        } catch (error) {
            console.error("Error submitting report:", error);
        }
    };

    
    useEffect(() => {
        if (questions.length > 0) {
            checkActiveRequest();
        }
    }, [currentQuestion, questions]);


    const submitAnswer = async () => {
        const question = questions[currentQuestion];

        if (responses[currentQuestion]?.submitted) {
            setFeedback("You already submited an answer to this exercise!.");
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
                    : `The answer is ${correctAnswer}`
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
                var className = "indicator";
    
                if (index == currentQuestion)
                    className += " current";

                if (status === true)
                    className += " correct";
                else if (status === false)
                    className += " incorrect";

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
                return <p>Error: Options not available for this exercise.</p>;
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
            // Initializam cuvintele disponibile doar o singură dată
            if (availableWords.length === 0 && dragItems.length === 0) {
                const shuffledWords = shuffleArray(question.correct_answer.split(" "));
                setAvailableWords(shuffledWords);
            }

            return (
                <div className="rearrange-container">
                    
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
                {questions.length === 0 ? (<button onClick={fetchQuestions} className="accent-btn">Start</button>) : (
                    renderQuestionIndicators()
                )}
            </div>


            { questions.length > 0  && (
                <div className="question">

                    {questions[currentQuestion].type === "fill_blank" && (<p className="question-type">{currentQuestion + 1}. Completeaza propozitia</p>)}
                    {questions[currentQuestion].type === "rearrange" && (<p className="question-type">{currentQuestion + 1}. Rearanjeaza cuvintele</p>)}

                    <p className="question-sentence">{questions[currentQuestion].question}</p>

                  


                    {/* {questions[currentQuestion].translation && (
                        <p className="translation">
                            {questions[currentQuestion].translation}
                        </p>
                    )} */}

                    {renderQuestionOptions(questions[currentQuestion])}
                    {feedback && (<p className={`feedback ${feedback.includes("Correct") ? "correct" : "incorrect"}`}>{feedback}</p>)}

                    <div className="question-buttons">
                        <button className="accent-btn" onClick={submitAnswer}>Sumbit</button>
                        <div className="question-buttons-order">
                        <button
    className="accent-btn report-btn"
    onClick={async () => {
        try {
            const exerciseId = questions[currentQuestion]?.id;

            if (!exerciseId) {
                alert("Exercise unavailable.");
                return;
            }

            // Verificăm în baza de date dacă există o cerere activă
            const response = await api.get(
                `/user_requests?user_id=${user.id}&exercise_id=${exerciseId}`
            );

            if (response.data.hasActiveRequest) {
                setHasActiveRequest(true);
                alert("You already have an active report for this exercise.");
            } else {
                setHasActiveRequest(false);
                setShowReportBox(true); 
            }
        } catch (error) {
            console.error("Eroare la verificarea cererii active:", error);
        }
    }}
>
    Report
</button>

                            <button className="accent-btn" onClick={handlePrevious} disabled={currentQuestion === 0}>Previous</button>
                            <button className="accent-btn" onClick={handleNext} disabled={currentQuestion === questions.length - 1}>Next</button>
                        </div>
                    </div>

                    


                    {showReportBox && !hasActiveRequest && (
    <div className="overlay" onMouseDown={() => setShowReportBox(false)}>
        <div class="form-container" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Report</h2>
            <textarea
                className="suggestion-textarea"
                placeholder="Write a message for the reviewer!"
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
            />
            <button
                className="accent-btn"
                onClick={() => {submitReport();}}
            >
                Trimite
            </button>
        </div>
    </div>
)}
                </div>
            )}
        </>
    );
}
export default Questions;
