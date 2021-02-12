import axios from "axios";
import NoteList from "./components/NoteList";

import "./App.css";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";

function App() {
  const googleLogin = async (event) => {
    const URL = "http://localhost:8080/auth/google";
    const response = axios.get(URL);
    console.log(response);
  };

  return (
    <div>
      <Box
        mx={2}
        display="flex"
        minHeight={64}
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Box fontSize="h5.fontSize" fontWeight="bold">
            Notes
          </Box>
        </Box>
        <Box>
          <Button onClick={googleLogin}>Sign In with Google</Button>
        </Box>
      </Box>
      <NoteList />
    </div>
  );
}

export default App;
