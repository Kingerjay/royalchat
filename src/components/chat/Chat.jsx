 import { useEffect, useRef, useState } from "react"
import "./chat.css"
 import EmojiPicker from "emoji-picker-react"
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { supabase } from "../../lib/supabase";
import { FaPhoneAlt, FaTrash, FaEllipsisV } from "react-icons/fa";
import { IoVideocam } from "react-icons/io5";
import { FaInfoCircle } from "react-icons/fa";
import { FaRegImage } from "react-icons/fa6";
import { FaCamera } from "react-icons/fa";
import { MdSettingsVoice } from "react-icons/md";
import { VscSmiley } from "react-icons/vsc";
import { format } from "timeago.js";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";
 
 const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeMessageId, setActiveMessageId] = useState(null);
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
  if (!chatId) return; // Prevent running when chatId is undefined

  console.log("Setting up Firestore real-time listener...");
  const chatRef = doc(db, "chats", chatId);

  const unSub = onSnapshot(chatRef, (res) => {
   console.log("Firestore update received:", res.data());
    setChat(res.data());

    // Check if the current user is NOT the sender
    if (res.data()?.messages?.length > 0) {
      const lastMessage = res.data().messages[res.data().messages.length - 1];

      if (lastMessage.senderId !== currentUser.id) {
        // Mark message as seen
         updateDoc(doc(db, "userchats", currentUser.id), {
          [`chats.${chatId}.isSeen`]: true
        });
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


  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnapshot = await getDoc(chatRef);

      if (chatSnapshot.exists()) {
        const chatData = chatSnapshot.data();
        const updatedMessages = chatData.messages.filter(
          (message) => message.createdAt.toDate().getTime() !== messageId
        );

        await updateDoc(chatRef, {
          messages: updatedMessages,
        });
        
        // Close the dropdown menu after deleting
        setActiveMessageId(null);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };


   return (
     <div className='chat'>
        <div className="top">
          <div className="user">
            <img src={user?.avatar || "./avatar.png"} alt="" />
            <div className="texts">
              <span className="capitalize">{user?.username}</span>
              <p>You're currently chatting with {user?.username}</p>
            </div>
          </div>
          <div className="icons">
            <FaPhoneAlt className="size-5"/>
            <IoVideocam className="size-5"/>
            <FaInfoCircle className="size-5"/>
          </div>
        </div>
        <div className="center">
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
          {message.senderId === currentUser.id ? (
  chat?.isSeen ? (
    <img src="/double-tick.png" alt="Seen" style={{ width: "1.3rem", height: "1.3rem" }} />
  ) : (
    <IoCheckmark size="1.3rem" title="Sent"/>
  )
) : null}
              </div>
    </div>
          </div>
          ))}

          {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="preview" />
            </div>
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
            alt="" />
          </label>
            <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
            {/* <FaCamera title="camera" className="size-6"/> */}
            <img 
            src="/camera2.png"
            style={{ width: "1.5rem", height: "1.5rem" }} 
            alt="" 
            title="camera" />
            
            <img 
            src="/voice.png" 
            style={{ width: "1.5rem", height: "1.5rem" }} 
            alt="" 
            title="voice"/>

          </div>
          <input 
          type="text" 
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
     </div>
   )
 }
 
 export default Chat