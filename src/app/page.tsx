"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Idea {
  id: number;
  content: string;
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    const { data, error } = await supabase
      .from("ideas")
      .select("id, content")
      .order("id", { ascending: false });

    if (error) {
      setError("Nepodarilo sa načítať nápady.");
      return;
    }
    setIdeas(data ?? []);
  }

  async function addIdea() {
    const trimmed = newIdea.trim();
    if (!trimmed) return;

    setError("");
    const { error } = await supabase.from("ideas").insert({ content: trimmed });

    if (error) {
      setError("Nepodarilo sa pridať nápad.");
      return;
    }

    setNewIdea("");
    fetchIdeas();
  }

  async function deleteIdea(id: number) {
    setError("");
    const { error } = await supabase.from("ideas").delete().eq("id", id);

    if (error) {
      setError("Nepodarilo sa vymazať nápad.");
      return;
    }

    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      addIdea();
    }
  }

  return (
    <div className="container">
      <h1>Zápisník nápadov</h1>

      {error && <p className="error">{error}</p>}

      <div className="input-row">
        <input
          type="text"
          placeholder="Napíš svoj nápad..."
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn-add" onClick={addIdea} disabled={!newIdea.trim()}>
          Pridať
        </button>
      </div>

      {ideas.length === 0 ? (
        <p className="empty">Zatiaľ žiadne nápady. Pridaj prvý!</p>
      ) : (
        <ul className="ideas-list">
          {ideas.map((idea) => (
            <li key={idea.id} className="idea-item">
              <span>{idea.content}</span>
              <button className="btn-delete" onClick={() => deleteIdea(idea.id)}>
                Vymazať
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
