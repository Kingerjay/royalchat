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

const Pagesroute = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [hasChats, setHasChats] = useState(false);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      if (user?.uid) {
        fetchUserInfo(user.uid);

        // Fetch user chats from Firestore
        const userChatsRef = doc(db, "userchats", user.uid);
        const userChatsSnap = await getDoc(userChatsRef);

        if (userChatsSnap.exists() && userChatsSnap.data().chats.length > 0) {
          setHasChats(true);
        } else {
          setHasChats(false);
        }
      }
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container bg-[rgba(251,255,251,1)] flex ">
      <List />
      {chatId && <Chat />}
          {chatId && <Detail />}
      {/* {hasChats ? (
        <>
          {chatId && <Chat />}
          {chatId && <Detail />}
        </>
      ) : (
        <div>
          
        </div>
      )} */}
      <Notification />
    </div>
  );
};

export default Pagesroute;
