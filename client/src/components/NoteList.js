import { useEffect, useState, useRef, useCallback } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import ShareDB from "sharedb/lib/client";
import Box from "@material-ui/core/Box";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Grid from "@material-ui/core/Grid";
import TextareaAutosize from "@material-ui/core/TextareaAutosize";

const BACKSPACE_KEYCODE = 8;

const socket = new ReconnectingWebSocket("ws://localhost:8080");
const connection = new ShareDB.Connection(socket);

const notes = [
  {
    title: "Team Lunch",
    author: "Tony",
    date: "2021-02-04",
    text: "Get lunch with the Wargamging team at Panera Bread.",
  },
  {
    title: "Spend time with my dog",
    author: "Tony",
    date: "2021-02-04",
    text: "Take a walk in the evening with my dog Max.",
  },
];

export default function NoteList() {
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [notes, setNotes] = useState([]);
  const isBackSpacePressed = useRef(false);

  useEffect(() => {
    const query = connection.createFetchQuery(
      "notes",
      {},
      {},
      (err, results) => {
        setNotes(results);
      }
    );

    return () => {
      query.destroy();
    };
  }, []);

  useEffect(() => {
    if (selectedNoteId) {
      const doc = notes[selectedNoteId];
      doc.subscribe();
      doc.on("load", () => {
        console.log("load");
      });
      doc.on("op", (op, source) => {
        const newNotes = [...notes];
        setNotes(newNotes);
      });
    }
  }, [selectedNoteId]);

  const handleChange = (event) => {
    console.log("handleChange");
    event.preventDefault();
    const text = event.target.value;
    const cursorPosition = event.target.selectionStart;

    if (!isBackSpacePressed.current) {
      const stringToInsert = text.charAt(cursorPosition - 1);
      const op = [{ p: ["text", cursorPosition - 1], si: stringToInsert }];
      sumbitOp(selectedNoteId, op);
    }
  };

  const handleKeyDown = (event) => {
    console.log("handleKeyDown");
    const cursorPosition = event.target.selectionStart;
    const text = event.target.value;

    if (event.keyCode === BACKSPACE_KEYCODE) {
      if (text) {
        const stringToDelete = text.charAt(cursorPosition - 1);
        const op = [{ p: ["text", cursorPosition - 1], sd: stringToDelete }];
        sumbitOp(selectedNoteId, op);
        isBackSpacePressed.current = true;
      }
    } else {
      isBackSpacePressed.current = false;
    }
  };

  const sumbitOp = (selectedNoteId, op) => {
    connection.get("notes", selectedNoteId).submitOp(op, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  };

  return (
    <>
      <Grid container>
        <Grid item xs={3}>
          <List component="nav" aria-label="note list" disablePadding>
            {notes.map((note) => {
              const secondaryText = `${note.data.date}`;
              return (
                <ListItem
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                  }}
                  button
                  divider
                  selected={selectedNoteId === note.id}
                >
                  <ListItemText
                    primary={note.data.title}
                    secondary={secondaryText}
                  />
                </ListItem>
              );
            })}
          </List>
        </Grid>
        <Grid item xs={9}>
          {selectedNoteId ? (
            <Box display="flex" pr={2}>
              <Box
                id="note"
                p={2}
                component={TextareaAutosize}
                value={notes[selectedNoteId].data.text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </>
  );
}