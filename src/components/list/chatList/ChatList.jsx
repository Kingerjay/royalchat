import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { IoCheckmark, IoCheckmarkDone, IoTrash } from "react-icons/io5";


const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();

          return { ...item, user };
        });

        const chatData = await Promise.all(promises);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );


  const handleDeleteChat = async (chatId) => {
  // if (!window.confirm("Are you sure you want to delete this chat?")) return;

  const userChatsRef = doc(db, "userchats", currentUser.id);
  
  try {
    // Remove chat from Firestore
    await updateDoc(userChatsRef, {
      chats: chats.filter((chat) => chat.chatId !== chatId), // Update state
    });

    // Update local state
    setChats((prevChats) => prevChats.filter((chat) => chat.chatId !== chatId));
  } catch (err) {
    console.error("Error deleting chat:", err);
  }
};



  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        

        <p
        className="bg-[#032477b4] p-2 rounded-lg font-medium cursor-pointer text-white hover:bg-[#2f53aeb4]"
        onClick={() => setAddMode((prev) => !prev)}
        >{addMode ? "Add" : "Add"}</p>

      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          // style={{
          //   backgroundColor: chat?.isSeen ? "transparent" : "lightgray",
          // }}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user.avatar || "./avatar.png"
            }
            alt=""
          />
          <div className="texts w-full">
            <div className="flex items-center justify-between">
              {chat.user.blocked.includes(currentUser.id)
                ? "User"
                : chat.user.username}

                <span>
                  {/* Delete Icon */}
                  <IoTrash 
                    title="delete"
                    className="text-red-500 cursor-pointer hover:text-red-700 ml-2"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering chat selection
                      handleDeleteChat(chat.chatId);
                    }}
                    /></span>
            </div>
            <p className="flex items-center justify-between">{chat.lastMessage.slice(0,30) || "No message yet"} <span className="">{chat?.isSeen ? <img src="/double-tick.png" alt="" style={{width:"1.3rem", height:"1.3rem"}}/> : <IoCheckmark size="1.3rem"/>}</span></p>
          </div>
                      
          
        </div>
      ))}

      {/* {addMode && <AddUser />} */}
      {addMode && <AddUser onClose={() => setAddMode(false)} />}
    </div>
  );
};

export default ChatList;