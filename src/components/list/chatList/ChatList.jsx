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
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false); // State for showing modal
  const [chatToDelete, setChatToDelete] = useState(null); // Store the chat to be deleted

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        if (!Array.isArray(items)) {
  console.error("Expected 'chats' to be an array but got:", items);
  return; // Exit if 'chats' is not an array
}

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

  const handleDeleteChat = (chatId) => {
    setChatToDelete(chatId); // Set the chat to be deleted
    setShowConfirmDeleteModal(true); // Show the confirmation modal
  };

  const confirmDelete = async () => {
    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      // Remove chat from Firestore
      await updateDoc(userChatsRef, {
        chats: chats.filter((chat) => chat.chatId !== chatToDelete), // Update state
      });

      // Update local state
      setChats((prevChats) => prevChats.filter((chat) => chat.chatId !== chatToDelete));

      // Close the modal
      setShowConfirmDeleteModal(false);
      setChatToDelete(null);
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDeleteModal(false); // Close the modal if canceled
    setChatToDelete(null); // Clear chat to delete
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
          className="bg-[#032477b4] p-[10px] rounded-lg font-medium cursor-pointer text-white hover:bg-[#2f53aeb4] whitespace-nowrap"
          onClick={() => setAddMode((prev) => !prev)}
        >
          {addMode ? "Add Friend" : "Add Friend"}
        </p>
      </div>

      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
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
                    handleDeleteChat(chat.chatId); // Show confirmation modal
                  }}
                />
              </span>
            </div>
            <p className="flex items-center justify-between">
              {chat.lastMessage.slice(0, 30) || "No message yet"}{" "}
              <span className="">
                {chat?.isSeen ? (
                  <img
                    src="/double-tick.png"
                    alt=""
                    style={{ width: "1.3rem", height: "1.3rem" }}
                  />
                ) : (
                  <IoCheckmark size="1.3rem" />
                )}
              </span>
            </p>
          </div>
        </div>
      ))}

      {filteredChats.length === 0 && !addMode && (
  <p className="text-center text-gray-500 mt-4">
    No friends yet. Add a friend to start chatting!
  </p>
)}

      {addMode && <AddUser onClose={() => setAddMode(false)} />}

      {/* Confirmation Modal */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg text-center w-72">
            <p>Are you sure you want to delete this chat?</p>
            <div className="mt-4 flex justify-between">
              <button
                className="bg-red-500 text-white py-2 px-4 rounded-md cursor-pointer hover:bg-red-700"
                onClick={confirmDelete}
              >
                Yes, delete
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-md cursor-pointer hover:bg-blue-700"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
