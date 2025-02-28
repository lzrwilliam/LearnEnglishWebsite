import api from "../api";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../App";


function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");
    const [roleRequestStatus, setRoleRequestStatus] = useState({ has_request: false, role_requested: null });

    const fetchUpdatedUser = async () => {
        try {
            const response = await api.get(`/user/${user.id}`); 
            setUser(response.data.user);
            localStorage.setItem("user", JSON.stringify(response.data.user));
        } catch (error) {
            console.error("Error fetching updated user:", error);
        }
    };

    const fetchRoleRequestStatus = async () => {
        try {
            const response = await api.get("/profile/role_request_status");
            setRoleRequestStatus(response.data);
        } catch (error) {
            console.error("Error checking role request status:", error);
        }
    };

    useEffect(() => {
        fetchUpdatedUser();
        fetchRoleRequestStatus();
    });

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
          await api.post(
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


      const handleDifficultyChange = async (e) => {
        const newDifficulty = e.target.value.toLowerCase();
        try {
            const response = await api.put("/profile/update_difficulty", { difficulty: newDifficulty });
            setMessage(response.data.message);
            setStatus("success");
           fetchUpdatedUser();
        } catch (error) {
            setMessage(error.response?.data?.message || "An error occurred.");
            setStatus("fail");
        }
    };
    
   
    
    const handleResetProgress = async () => {
        try {
            const response = await api.delete("/profile/reset_progress");
            setMessage(response.data.message);
            setStatus("success");
            fetchUpdatedUser();

        } catch (error) {
            setMessage(error.response?.data?.message || "An error occurred.");
            setStatus("fail");
        }
    };
    
    const handleDeleteAccount = async () => {
        try {
            const response = await api.delete("/profile/delete_account");
            setMessage(response.data.message);
            setStatus("success");            
            setUser(null); 
            localStorage.removeItem("user");
             sessionStorage.removeItem("user");
           localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        window.location.href = "/login";
        } catch (error) {
            setMessage(error.response?.data?.message || "An error occurred.");
            setStatus("fail");
        }
    };

    const handleRoleRequest = async (role) => {
      try {
          const response = await api.post("/profile/request_role", { role });
          setMessage(response.data.message);
          setStatus("success");
          fetchRoleRequestStatus(); 
      } catch (error) {
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
        <div className={`error alert ${status === "fail" ? "alert-danger" : "alert-success"}`}>
          {message}
        </div>
      )}
      <div className="line"/>
            <div>

            </div>
            <div className="row">
                <label>Difficulty</label>
                <select value={user.difficulty.charAt(0).toUpperCase() + user.difficulty.slice(1) }  onChange={handleDifficultyChange}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                </select>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Request admin role, this will enable you to kick or ban users.</label>
                <button className="accent-btn"  onClick={() => handleRoleRequest("admin")} disabled={roleRequestStatus.has_request || user.role==="admin"}> 
                {user.role === "admin"
                        ? "Admin Role Active"
                        : roleRequestStatus.has_request && roleRequestStatus.role_requested === "admin"
                        ? "Request Pending"
                        : "Request"}</button>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Request reviewer role, this will allow out to modify or add new exercises.</label>
                <button className="accent-btn"  onClick={() => handleRoleRequest("reviewer")} disabled={roleRequestStatus.has_request || user.role==="reviewer"}> 
                {user.role === "reviewer"
                        ? "Reviewer Role Active"
                        : roleRequestStatus.has_request && roleRequestStatus.role_requested === "reviewer"
                        ? "Request Pending"
                        : "Request"}</button>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Reset the progress on this account, including xp.</label>
                <button className="accent-btn" onClick={handleResetProgress}>Reset</button>
            </div>
            <div className="line"/>
            <div className="row">
                <label>Delete this account, this action cannot be undone.</label>
                <button className="accent-btn reject-btn" onClick={handleDeleteAccount}>Delete</button>
            </div>
        </div>
    );
}

export default Profile;