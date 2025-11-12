import { useState, useEffect } from "react";
import './App.css'

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:3000/api/hello")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage("Backend not reachable"));
  }, []);

  return (
    <div>
      <h1>React + Express App</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
