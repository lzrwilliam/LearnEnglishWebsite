import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../App";
import api from "../api";

const Achievements = () => {
    const { user } = useContext(AuthContext);
    const [achievements, setAchievements] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const response = await api.get(`/user_achievements/${user.id}`);
                console.log("Achievements fetched:", response.data);
                setAchievements(response.data);
            } catch (error) {
                console.error("Error fetching achievements:", error);
                setError("Failed to load achievements. Please try again later.");
            }
        };

        if (user) {
            fetchAchievements();
        }
    }, [user]);

    if (!user) {
        return <p>Please log in to see your achievements.</p>;
    }

    return (
        <div className="achievements-container">
            <h2>Achievements</h2>
            {error && <p className="error">{error}</p>}
            {achievements.length === 0 ? (
                <p>Loading achievements...</p>
            ) : (
                <div className="achievements-list">
                    {achievements.map(({ achievement, progress, completed }) => (
                        <div key={achievement.id} className={`achievement ${completed ? "completed" : ""}`}>
                            <div className="achievement-icon">
                                {/* <img src={`/images/icons/${achievement.icon}`} alt={achievement.name} /> */}
                            </div>
                            <div className="achievement-details">
                                <h3>{achievement.name}</h3>
                                <p>{achievement.description}</p>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${(progress / achievement.goal) * 100}%` }}
                                    ></div>
                                </div>
                                <p>
                                    {progress} / {achievement.goal} {completed && <span className="badge">Completed!</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Achievements;
