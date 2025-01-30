import "./userInfo.css"
import { useUserStore } from "../../../lib/userStore"

const Userinfo = () => {
  const {currentUser} = useUserStore()

  return (
    <div className='userInfo bg-gray-300 rounded-s-lg'>
        <div className="user">
            <img src={currentUser.avatar || "./avatar.png"} alt="" />
            <h2 className="capitalize font-semibold text-xl ">{currentUser.username} <span></span></h2>
        </div>

        {/* <div className="icons">
            <img src="./more.png" alt="" />
            <img src="./video.png" alt="" />
            <img src="./edit.png" alt="" />
        </div> */}
    </div>
  )
}

export default Userinfo