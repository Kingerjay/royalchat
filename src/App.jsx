import { useEffect } from "react";
import './index.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import Pagesroute from "./components/pagesroute/Pagesroute";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import Notification from "./components/notification/Notification";
import List from "./components/list/List";
import { Atom, Commet } from "react-loading-indicators";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      // fetchUserInfo(user?.uid);
      if (user) {
      // User is logged in, update currentUser in the store
      fetchUserInfo(user.uid);
    } else {
      // No user, set currentUser to null
      fetchUserInfo(null);
    }
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  useEffect(() => {
  console.log("currentUser updated:", currentUser);  // This will log whenever currentUser is updated
}, [currentUser]);


  if (isLoading) return <div className="loading"><Commet color="white" size="large" text="" textColor="" /></div>;

  return (
    <div className="container">

      <Notification/>
      <Routes>
        
        <Route path="/" element={currentUser ?  <Pagesroute/>  : <Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/list" element={<List/>} />
        
        {/* Redirect unknown routes to home (login) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
