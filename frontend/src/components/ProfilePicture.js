import api from "../api";
import { useState, useEffect } from "react";

function ProfilePicture({user_id}) {
    const imageUrl = `http://localhost:5000/api/pfp/${user_id}`;

    return (
        <div className="pfp">
            <img src={imageUrl} 
            style={{display: "none", width: "100%", height: "100%", objectFit: "cover", background: "white"}} 
            onLoad={(e) => e.target.style.display = "block"}/>
        </div>
    );
}

export default ProfilePicture;