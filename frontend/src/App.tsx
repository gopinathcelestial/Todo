import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import {SignIn} from './components/SignIn';
import {SignUp} from './components/SignUp';
import {Todos} from './components/Todos';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<Todos />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
