import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { Todos } from "./components/Todos";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MicrophoneButton from "./components/MicIcon";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<Todos />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
