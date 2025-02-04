import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase"
import { useUserStore } from "../../lib/userStore";
import "./detail.css"
import { useState } from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat } =
    useChatStore();
  const { currentUser } = useUserStore();

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isAccordionOpen1, setIsAccordionOpen1] = useState(false);

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove (user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  }


  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  const toggleAccordion1 = () => {
    setIsAccordionOpen1(!isAccordionOpen1);
  };



  return (
    <div className='detail'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
        <p>{user?.email}</p>
      </div>
      <div className="info">
        <div className="flex flex-col gap-4 mb-10">
        <div 
        className="option" 
        onClick={toggleAccordion}
        >
          <div className="title">
            <span className="">Chat Settings</span>
            <img src={isAccordionOpen ? "./arrowDown.png" : "./arrowUp.png"} alt="" style={{width:"1.7rem", height:"1.7rem"}}/>
            {/* {isAccordionOpen ? <IoIosArrowDown className="bg-[blueviolet] rounded-full w-[1.5rem] h-[1.5rem] text-red border-white font-bold"  /> : <IoIosArrowUp />} */}
          </div>
        </div>

        {isAccordionOpen && (
          <div className="accordion-content">
            <p>Add Profile bio</p>
          </div>
        )}

        <div 
        className="option" 
        onClick={toggleAccordion1}
        >
          <div className="title">
            <span className="">Privacy & help</span>
            <img src={isAccordionOpen1 ? "./arrowDown.png" : "./arrowUp.png"} alt="" style={{width:"1.7rem", height:"1.7rem"}}/>
            {/* {isAccordionOpen ? <MdOutlineKeyboardArrowDown /> : <IoIosArrowUp />} */}
          </div>
        </div>

        {isAccordionOpen1 && (
          <div className="accordion-content">
            <p>We value your privacy and are committed to protecting your data:</p>
            {/* <ul>
              <li><span>Data Collection:</span> We collect only the necessary information.</li>
              <li><span>Data Use:</span> Messages are encrypted and securely stored.</li>
              <li><span>Control:</span> You can delete your account or data anytime.</li>
            </ul> */}
            <p>
              Need help? Contact support at <strong>support@chatapp.com</strong>.
            </p>
          </div>
        )}
          </div>
        
        <div className="bottom-wrapper">
        <button onClick={handleBlock}>{
          isCurrentUserBlocked
            ? "You are Blocked!"
            : isReceiverBlocked
            ? "User blocked"
            : "Block User"
          }</button>
        <button 
        className="logout"
        onClick={() => auth.signOut()}
        >
          Logout
          </button>
          </div>

      </div>
    </div>
  )
}

export default Detail