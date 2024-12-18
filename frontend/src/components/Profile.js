import api from "../api";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../App";


function Profile() {
    const { user } = useContext(AuthContext);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
          setMessage("No file selected.");
          setStatus("fail");
          return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
    
        try {
          const response = await api.post(
            `/upload_profile_picture/${user.id}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          window.location.reload();

        } catch (error) {
          // Handle errors
          setMessage(error.response?.data?.message || "An error occurred.");
          setStatus("fail");
        }
      };

    return (
        <div class="profile">
            <h1>Profile</h1>
            <form onSubmit={handleSubmit} className="row">
                <label>Upload profile picture</label>
                <input id="browse" type="file" onChange={handleFileChange}/>
                <button type="submit" className="accent-btn fit-content">Upload</button>
            </form>
            {message && (
        <div className={`alert ${status === "fail" ? "alert-danger" : "alert-success"}` + " error"}>
          {message}
        </div>
      )}
      <div className="line"/>
            <div>

            </div>
            <div className="row">
                <label>Difficulty</label>
                <select value={user.difficulty.charAt(0).toUpperCase() + user.difficulty.slice(1) }>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                </select>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Request admin role, this will enable you to kick or ban users.</label>
                <button className="accent-btn">Request</button>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Request reviewer role, this will allow out to modify or add new exercises.</label>
                <button className="accent-btn">Request</button>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Reset the progress on this account, including xp.</label>
                <button className="accent-btn">Reset</button>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Delete this account, this action cannot be undone.</label>
                <button className="accent-btn reject-btn">Delete</button>
            </div>
        </div>
    );
}

export default Profile;