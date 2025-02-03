 import { useEffect, useRef, useState } from "react"
import "./chat.css"
 import EmojiPicker from "emoji-picker-react"
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { supabase } from "../../lib/supabase";
import { FaPhoneAlt, FaTrash, FaEllipsisV, FaCog } from "react-icons/fa";
import { IoVideocam } from "react-icons/io5";
import { FaInfoCircle } from "react-icons/fa";
import { format } from "timeago.js";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";
import { IoArrowBack } from "react-icons/io5";
 
 const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeMessageId, setActiveMessageId] = useState(null);
  const { resetChat } = useChatStore();
  const [isPopOutOpen, setIsPopOutOpen] = useState(false);


  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const {currentUser} = useUserStore();
  const {chatId, user, isCurrentUserBlocked, isReceiverBlocked} = useChatStore();

  const endRef = useRef(null)

  useEffect(() => {
  if (endRef.current) {
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }
}, [chat?.messages]);


useEffect(() => {
  if (!chatId) return;

  console.log("Setting up Firestore real-time listener...");
  const chatRef = doc(db, "chats", chatId);

  const unSub = onSnapshot(chatRef, async (res) => {
    console.log("Firestore update received:", res.data());
    const chatData = res.data();
    setChat(chatData);

    // Check if the user is the receiver and needs to mark messages as seen
    if (chatData?.messages?.length > 0) {
      let hasUnseenMessage = false;
      const updatedMessages = chatData.messages.map((msg) => {
        if (msg.senderId !== currentUser.id && !msg.isSeen) {
          hasUnseenMessage = true;
          return { ...msg, isSeen: true };
        }
        return msg;
      });

      if (hasUnseenMessage) {
        try {
          await updateDoc(chatRef, { messages: updatedMessages });

          // Update the userchats collection
          await updateDoc(doc(db, "userchats", currentUser.id), {
            [`chats.${chatId}.isSeen`]: true,
          });

          console.log("Messages marked as seen");
        } catch (error) {
          console.error("Error updating seen status:", error);
        }
      }
    }
  });

  return () => {
    console.log("Cleaning up Firestore listener...");
    unSub();
  };
}, [chatId]);



  

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setTimeout(() => setOpen(false), 100);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };


  // Upload to Supabase
  const uploadToSupabase = async (file) => {
  try {
    // Generate a unique file name for the uploaded image
    const fileName = `chat-images/${Date.now()}_${file.name}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("chat-images") 
      .upload(fileName, file);

    if (error) throw error;

    // Get the public URL for the uploaded image
    const { publicUrl } = supabase.storage.from("chat-images").getPublicUrl(fileName);
    return publicUrl;
  } catch (error) {
    console.error("Error uploading image to Supabase:", error.message);
    return null;
  }
};


const handleSend = async () => {
  
  if (!text && !img.file) return; 

  let imgUrl = null;

  try {
    // Upload image to Supabase storage if provided
if (img.file) {
  const filePath = `images/${Date.now()}_${img.file.name}`;
  const { error } = await supabase.storage
    .from("chat-images") 
    .upload(filePath, img.file);

  if (error) throw error;

  // Get the public URL of the uploaded image
  const { data } = supabase.storage.from("chat-images").getPublicUrl(filePath);
  imgUrl = data?.publicUrl || null;
}


    // Build the new message object
    const newMessage = {
      senderId: currentUser.id,
      createdAt: new Date(),
      isSeen: false,
      ...(text && { text }),
      ...(imgUrl && { img: imgUrl }), // Add the image URL from Supabase
    };
    console.log("Sending message:", newMessage);

    // Save the message to Firestore
    await updateDoc(doc(db, "chats", chatId), {
      messages: arrayUnion(newMessage),
    });

    const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen = false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });

    
  } catch (err) {
    console.error("Error sending message:", err);
  }

  // Reset input fields
  setImg({
    file: null,
    url: "",
  });
  setText("");
  setOpen(false);
};


  const handleDeleteMessage = async (messageId) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (chatSnapshot.exists()) {
      let chatData = chatSnapshot.data();
      const updatedMessages = chatData.messages.filter(
        (message) => message.createdAt.toDate().getTime() !== messageId
      );

      await updateDoc(chatRef, {
        messages: updatedMessages,
      });

      // Determine the new last message
      const lastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
      const newLastMessageText = lastMessage?.text || (lastMessage?.img ? "Image" : "No messages yet");

      // Update last message in userchats for both users
      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1) {
            userChatsData.chats[chatIndex].lastMessage = newLastMessageText;
            userChatsData.chats[chatIndex].updatedAt = Date.now();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        }
      });

      setActiveMessageId(null);
    }
  } catch (err) {
    console.error("Error deleting message:", err);
  }
};




   return (
     <div className='chat'>
        <div className="top">
        {window.innerWidth < 768 && (
          <button onClick={resetChat} className="back-button">
            <IoArrowBack className="size-6" />
          </button>
        )}
          <div className="user">
            <img src={user?.avatar || "./avatar.png"} alt="" />
            <div className="texts">
              <span className="capitalize">{user?.username}</span>
              <p>You're currently chatting with {user?.uername}</p>
            </div>
          </div>
          <div className="icons">
            <FaPhoneAlt className="size-5 "/>
            {/* <IoVideocam className="size-5"/> */}
            <FaCog className="size-5 cursor-pointer hidden lg:block 2xl:hidden" onClick={() => setIsPopOutOpen(!isPopOutOpen)} />
            <FaInfoCircle className="size-5 cursor-pointer lg:hidden" onClick={() => useChatStore.getState().toggleDetail()} />

          </div>
        </div>
        <div className="center bg-chaty-bg">
          {chat?.messages?.length === 0 && 
          <div className=" w-full h-full flex justify-center items-center">
            <div className="bg-white w-1/2 h-1/2 flex flex-col justify-center items-center gap">
              <img src="/empty-chat.gif"
            style={{width:"5rem", height:"5rem", backgroundColor:"transparent"}}
            alt="" />
            <p className="text-xl italic">No messages yet...</p>
            </div>
            </div>}
          {chat?.messages?.map((message) => (
          <div className={message.senderId === currentUser?.id ? "message own" : "message"} 
          key={message?.createdAt}>

            {/* Showing the Text and Images */}
            <div className="texts">
      {message.img && <img src={message.img} alt="chat" />}
      {message.text && <p className="w-full flex justify-between items-center gap-4">
        {message.text}
        <span>{/* Three-dot menu for options */}
          {message.senderId === currentUser.id && (
            <div className="relative">
              <FaEllipsisV
                title="option"
                className="cursor-pointer"
                onClick={() => setActiveMessageId(activeMessageId === message.createdAt ? null : message.createdAt)}
              />
              
              {activeMessageId === message.createdAt && (
                <div className="absolute right-0 mt-3 w-18 bg-white border rounded-lg shadow-lg z-10">
                  <button
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => handleDeleteMessage(message.createdAt.toDate().getTime())}
                  >
                    <FaTrash title="delete" className=" mx-auto my-2" />
                  </button>
                </div>
              )}
            </div>
          )}</span>
              </p>}

      <div className="flex justify-between">
      <span>{format(message.createdAt.toDate())}</span>

              {/* Seen status checkmark for sent messages */}
  {message.senderId === currentUser.id && (
    message.isSeen ? (
      <img src="/double-tick.png" alt="Seen" style={{ width: "1.3rem", height: "1.3rem" }} />
    ) : (
      <span className="text-gray-500 text-sm">Not seen</span>
    )
  )}
              </div>
    </div>
          </div>
          ))}

          {/* Image Preview Popup */}
{img.url && (
  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-lg">
    <p className="text-sm text-gray-500">Preview</p>
    <img src={img.url} alt="preview" className="w-40 h-40 object-cover rounded" />
    <button onClick={() => setImg({ file: null, url: "" })} className="mt-2 text-red-500 text-sm">
      Remove
    </button>
  </div>
)}

          <div ref={endRef}></div>

        </div>
        <div className="bottom">
          <div className="icons">
            <label htmlFor="file">
            {/* <FaRegImage title="image" className="size-6"/> */}
            <img 
            src="/gallery.png" 
            style={{ width: "1.5rem", height: "1.5rem" }}
            title="image"
            className=""
            alt="" />
          </label>
            <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
            {/* <FaCamera title="camera" className="size-6"/> */}
            {/* <img 
            src="/camera2.png"
            style={{ width: "1.5rem", height: "1.5rem" }} 
            alt="" 
            title="camera" /> */}
            
            <img 
            src="/voice.png" 
            style={{ width: "1.5rem", height: "1.5rem" }} 
            alt="" 
            className="hidden md:block"
            title="voice"/>

          </div>
          <input 
          type="text" 
          className=""
          placeholder={(isCurrentUserBlocked  || isReceiverBlocked) ? "You cannot send a message" : "Type your message here..." }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <div className="emoji">
            {/* <VscSmiley 
            className="size-6"
            title="emoji"
            style={{ color: "green" }}
            onClick={() => setOpen((prev) => !prev)}/> */}
            <img 
            src="/smiley.png" 
            title="emoji"
            onClick={() => setOpen((prev) => !prev)}
            style={{ width: "1.5rem", height: "1.5rem" }} 
            alt="" />
            <div className="picker">
              <EmojiPicker className="" open = {open} onEmojiClick={handleEmoji}/> 
            </div>
            
          </div>
          <button 
          className="sendButton"
          title="send"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
          >Send</button>
        </div>

        {/* Pop-out Content */}
      {isPopOutOpen && (
        <div className="absolute top-[5rem] right-0 w-1/2 h-1/2 bg-white z-10 shadow-lg p-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <p>Here you can put the settings content or any other information you want to show.</p>
        </div>
      )}
     </div>
   )
 }
 
 export default Chat