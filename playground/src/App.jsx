import { useState } from "react";

function App() {
  const [message, setMessage] = useState("Hello World!");

  return <div>{message}</div>;
}

export default App;
