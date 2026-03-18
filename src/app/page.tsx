"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Category {
  id: number;
  name: string;
}

interface Idea {
  id: number;
  content: string;
  category_id: number | null;
  categories: Category | null;
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIdeas();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      setError("Nepodarilo sa načítať kategórie.");
      return;
    }
    setCategories(data ?? []);
  }

  async function fetchIdeas() {
    const { data, error } = await supabase
      .from("ideas")
      .select("id, content, category_id, categories(id, name)")
      .order("id", { ascending: false });

    if (error) {
      setError("Nepodarilo sa načítať nápady.");
      return;
    }
    setIdeas(
      (data ?? []).map((item) => ({
        ...item,
        categories: Array.isArray(item.categories)
          ? item.categories[0] ?? null
          : item.categories ?? null,
      }))
    );
  }

  async function addIdea() {
    const trimmed = newIdea.trim();
    if (!trimmed) return;

    setError("");
    const insertData: { content: string; category_id?: number } = { content: trimmed };
    if (selectedCategory !== "") {
      insertData.category_id = selectedCategory;
    }
    const { error } = await supabase.from("ideas").insert(insertData);

    if (error) {
      setError("Nepodarilo sa pridať nápad.");
      return;
    }

    setNewIdea("");
    setSelectedCategory("");
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
        <select
          className="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Bez kategórie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
              <div className="idea-content">
                <span>{idea.content}</span>
                <span className="idea-category">
                  {idea.categories?.name ?? "Bez kategórie"}
                </span>
              </div>
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
