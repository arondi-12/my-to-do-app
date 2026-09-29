import { useEffect, useRef, useState } from "react";
import { api } from "../api";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function NotesSection() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the existing note once on mount
  useEffect(() => {
    api
      .getNote()
      .then((note) => setContent(note.content))
      .catch(() => setStatus("error"));
  }, []);

  function handleChange(value: string) {
    setContent(value);
    setStatus("idle");

    // Debounce: wait 800ms after the user stops typing before saving,
    // so we're not firing a request on every keystroke.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await api.updateNote(value);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  return (
    <section className="notes">
      <div className="notes__header">
        <h2>Notes</h2>
        <span className="notes__status">
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved"}
          {status === "error" && "Couldn't save"}
        </span>
      </div>
      <textarea
        className="notes__textarea"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Jot anything down here — separate from your tasks."
        rows={5}
      />
    </section>
  );
}