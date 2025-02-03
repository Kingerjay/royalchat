import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(""); // State to track errors
  const { currentUser } = useUserStore();
  const popOutRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message on new search
    setUser(null); // Clear previous user data

    const formData = new FormData(e.target);
    const username = formData.get("username").trim(); // Trim to remove spaces

    if (!username) {
      setError("Please enter a username.");
      return;
    }

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
        setError(""); // Clear error when user is found
      } else {
        setError(`User "${username}" not found.`); // Show error if user doesn't exist
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching.");
    }
  };

  const handleAdd = async () => {
  if (!user) return;

  const userChatsRef = doc(db, "userchats", currentUser.id);

  try {
    // Fetch the current user's chat list
    const userChatsSnap = await getDoc(userChatsRef);
    const existingChats = userChatsSnap.exists() ? userChatsSnap.data().chats : [];

    // Check if the user is already in the chat list
    const isAlreadyAdded = existingChats.some(chat => chat.receiverId === user.id);

    if (isAlreadyAdded) {
      setError("User is already in your chat list!");
      return;
    }

    // Create a new chat document
    const newChatRef = doc(collection(db, "chats"));
    await setDoc(newChatRef, {
      createdAt: serverTimestamp(),
      messages: [],
    });

    // Update both users' chat lists
    await updateDoc(userChatsRef, {
      chats: arrayUnion({
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: user.id,
        updatedAt: Date.now(),
      }),
    });

    await updateDoc(doc(db, "userchats", user.id), {
      chats: arrayUnion({
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: currentUser.id,
        updatedAt: Date.now(),
      }),
    });

    onClose(); // Close the pop-up after adding a user
  } catch (err) {
    console.error(err);
    setError("Failed to add user.");
  }
};


  // Close pop-up when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popOutRef.current && !popOutRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="addUser" ref={popOutRef}>
      <div className="mb-2 cursor-pointer" onClick={onClose}>
        <img src="/close.png" alt="" style={{ width: "30px", height: "30px" }} />
      </div>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Enter username" name="username" />
        <button>Search</button>
      </form>

      {/*  Show error message if no user is found */}
      {error && <p className="error-message">{error}</p>}

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span className="capitalize text-white">{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add Friend</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
