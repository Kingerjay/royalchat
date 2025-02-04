import "./userInfo.css"
import { useUserStore} from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";
import { useState } from "react";
import { IoEllipsisVertical } from "react-icons/io5";

const Userinfo = () => {
  const {currentUser} = useUserStore();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className='userInfo bg-gray-300 rounded-lg'>
        <div className="user">
            <img src={currentUser.avatar || "./avatar.png"} alt="" />
            <h2 className="capitalize font-semibold text-xl ">{currentUser.username} <span></span></h2>
        </div>

        <div className="relative">
          <IoEllipsisVertical 
          className="text-2xl cursor-pointer" 
          onClick={() => setShowOptions((prev) => !prev)}
          />

          {showOptions && (
            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg p-2 cursor-pointer text-red-500 hover:bg-gray-200">
              <p
              className="whitespace-nowrap"
              onClick={() => auth.signOut()}
              >
                Sign out
                </p>
            </div>
          )}

        </div>
    </div>
  )
}

export default Userinfo