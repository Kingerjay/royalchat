import React, { useState } from 'react';
import "./register.css";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from 'react-router-dom';
// import upload from "../../lib/upload";
import { supabase } from "../../lib/supabase"; 
import { collection, query, where, getDocs } from "firebase/firestore";
import { BlinkBlur } from 'react-loading-indicators';


const Register = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: ""
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();  // Initialize navigate function

  const handleAvatar = (e) => {  
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const uploadAvatarToSupabase = async (file) => {
  try {
    const fileName = `chat-images/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("chat-images")  
      .upload(fileName, file);

    if (error) throw error;

    // Get the public URL of the uploaded avatar
    const { publicUrl } = supabase.storage.from("chat-images").getPublicUrl(fileName);
    return publicUrl;
  } catch (err) {
    console.error("Error uploading avatar:", err.message);
    return null;
  }
};


  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const { username, email, password } = Object.fromEntries(formData);

    // VALIDATE INPUTS
    if (!username || !email || !password)
      return toast.warn("Please enter inputs!");
    

    // VALIDATE UNIQUE USERNAME
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return toast.warn("Select another username");
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      let avatarUrl = null;
      
    if (avatar.file) {   

      const filePath = `images/${Date.now()}_${avatar.file.name}`;
  const { error } = await supabase.storage
    .from("chat-images") 
    .upload(filePath, avatar.file);

  if (error) throw error;
  console.error("Error uploading avatar:", error?.message);

  // Get the public URL of the uploaded image
  const { data } = supabase.storage.from("chat-images").getPublicUrl(filePath);
  avatarUrl = data?.publicUrl || null;
      
    }

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: avatarUrl || "",
        id: res.user.uid,
        blocked: [],
      });
      console.log("Avatar URL to save:", avatarUrl);
      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created successfully!");

      // Reload the page
      setTimeout(() => {
      window.location.reload();  // Force a full reload to ensure the user state updates
    }, 500);
      
      // Redirect user to chat page after successful registration
      navigate("/");

      

    } catch (err) {
      console.log(err);
      console.error("Registration error:", err);
      toast.error(err?.message || "An unknown error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[rgba(251,255,251,1)] w-full rounded-md">
      <div className="w-full h-6 p-8">ROYALCHAT</div>
      <div className='register p-8 gap-6'>
        <div className="hidden lg:block">
            <img src="./texting2.svg" 
            className="  h-[500px]"
            alt="" />
        </div>

      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="Avatar" title="upload image"/>
            Upload an Image
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
          <h3>Username:</h3>
          <input type="text" placeholder="Username" name="username" required />
          <h3>Email Address:</h3>
          <input type="email" placeholder="Email" name="email" required />
          <h3>Password:</h3>
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? <BlinkBlur color="white" size="small" text="" textColor="" /> : "Sign Up"}</button>
        </form>
        <p>
          Already have an account? Sign in <Link to="/login"><span className='text-blue-700 font-bold underline'>Here</span></Link>
        </p>
      </div>
    </div>
    </div>
  );
};

export default Register;
