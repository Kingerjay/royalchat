import React, { useEffect, useState } from "react";
import Chat from "../chat/Chat";
import Detail from "../detail/Detail";
import List from "../list/List";
import Notification from "../notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { doc, getDoc } from "firebase/firestore";
import { Commet } from "react-loading-indicators";

const Pagesroute = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId, showDetail, toggleDetail, resetChat } = useChatStore();
  const [hasChats, setHasChats] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Adjusted for tablets and smaller devices
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      if (user?.uid) {
        fetchUserInfo(user.uid);

        try {
          const userChatsRef = doc(db, "userchats", user.uid);
          const userChatsSnap = await getDoc(userChatsRef);
        } catch (error) {
          console.error("Error fetching user chats:", error);
          setHasChats(false);
        }
      }
    });

    return () => unSub();
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading"><Commet color="#32cd32" size="large" text="" textColor="" /></div>;

  return (
    <div className="container bg-[rgba(251,255,251,1)] flex flex-col md:flex-row">

      {/* Chat List: Always visible on large screens */}
      <div className={`md:w-1/3 lg:w-1/3 2xl:w-1/3 ${isMobile && chatId ? "hidden" : ""}`}>
        <List />
      </div>

      {/* Show Chat ONLY if chat is open and Detail is NOT shown */}
      {chatId && !showDetail && (
        <div className="relative w-full h-full md:w-full lg:w-3/4">
          {isMobile }
          <Chat />
        </div>
      )}

      {/* Show Detail when showDetail is true and hide Chat */}
      {showDetail && (
        <div className="relative w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
          {isMobile && (
            <button
              onClick={toggleDetail}
              className="absolute top-2 left-2 bg-gray-300 px-3 py-1 rounded shadow-md"
            >
              Back
            </button>
          )}
          <Detail />
        </div>
      )}

      {/* Show Detail on larger screens when chat is open */}
      <div className="w-1/2 detail-side-panel p-4 hidden 2xl:block 2xl:w-1/3">
        {chatId && <Detail />}
      </div>

      <Notification />
    </div>
  );
};

export default Pagesroute;
