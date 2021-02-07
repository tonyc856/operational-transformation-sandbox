import NoteList from "./components/NoteList";

import "./App.css";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

function App() {
  return (
    <div>
      <Box display="flex" minHeight={64} alignItems="center">
        <Box mx={2}>
          <Box fontSize="h5.fontSize" fontWeight="bold">
            Notes
          </Box>
        </Box>
      </Box>
      <NoteList />
    </div>
  );
}

export default App;
