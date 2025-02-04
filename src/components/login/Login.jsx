import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth"
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore"
import { Link, useNavigate } from "react-router-dom";
import { BlinkBlur } from "react-loading-indicators";
// import upload from "../../lib/upload";



const Login = () => {
    const navigate= useNavigate();
    const [avatar, setAvatar] = useState({
        file:null,
        url:""
    })

    const [loading, setLoading] = useState(false)

    const handleAvatar = (e) => {  
        if (e.target.files[0]) {
        setAvatar({
            file:e.target.files[0],
            url: URL.createObjectURL(e.target.files[0])
        })
      }
    }
 
    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.target)

        const { username, email, password } = Object.fromEntries(formData);

        try {

            const res = await createUserWithEmailAndPassword(auth, email, password)

            // const imgUrl = await upload(avatar.file)

            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                // avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
            });

            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
            });


            toast.success("Account created! you can login now")
        } catch (err) {
            console.log(err)
            toast.error("Invalid Email / Password")
        } finally {
            setLoading(false)
        }
        
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true);

        const formData = new FormData(e.target)

        const { email, password } = Object.fromEntries(formData);



        try {
            await signInWithEmailAndPassword(auth, email, password)

            navigate("/")
            
        } catch (err) {
            console.log(err)
            toast.error(err.message)
        }
        finally {
            setLoading(false)
        }
    }


  return (
   <div className="bg-[rgba(251,255,251,1)] w-full rounded-md m-0">
    <div className="w-full h-6 pb-8 px-4">
        <p className="text-2xl text-purple-950 font-bold font-serif py-4">RoyalChat</p>
        {/* <img src="/logo3.webp" alt="" style={{width:"10rem", height:"7rem"}} /> */}
    </div>
     <div className='login p-8 gap-6'>
        <div className="relative hidden lg:block">
            <img src="./texting.svg" 
            className=" md:h-[500px] "
            alt="" />
            <img src="/chat-bubble.gif"
             alt="" 
             className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"  
             style={{width:"6rem", height:"6rem"}}/>
        </div>

        <div className="item">
            <h2 className="text-lg md:text-2xl text-black mb-10 ">Sign In</h2>
            <form onSubmit={handleLogin}>
                <h3>Email Address:</h3>
                <input type="text" placeholder="Email" name="email"  />
                <h3>Password:</h3>
                <input type="password" placeholder="password" name="password"  />
                <button disabled={loading}>{loading ? <BlinkBlur color="white" size="small" text="" textColor="" /> : "Sign In"}</button>
            </form>
            <p className="text-medium">No account yet? Register <Link to="/register"><span className='text-blue-700 font-bold underline'>Here</span></Link> </p>
        </div>
        
        
    </div>

   </div>
  )
}

export default Login