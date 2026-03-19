"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [error, setError] = useState("");

  // New category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchIdeas();
      fetchCategories();
    } else {
      setIdeas([]);
      setCategories([]);
    }
  }, [user]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    const { error } =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setAuthError(error.message);
    } else {
      setEmail("");
      setPassword("");
      if (authMode === "register") {
        setAuthError("Registrácia úspešná. Skontroluj email pre potvrdenie.");
      }
    }
    setAuthSubmitting(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIdeas([]);
    setError("");
  }

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
      .eq("user_id", user!.id)
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
    const insertData: { content: string; category_id?: number; user_id: string } = {
      content: trimmed,
      user_id: user!.id,
    };
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

  async function addCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setError("");
    const { error } = await supabase.from("categories").insert({ name: trimmed });

    if (error) {
      setError("Nepodarilo sa pridať kategóriu.");
      return;
    }

    setNewCategoryName("");
    setShowCategoryForm(false);
    fetchCategories();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      addIdea();
    }
  }

  if (authLoading) {
    return (
      <div className="container">
        <h1>Zápisník nápadov</h1>
        <p className="empty">Načítavam...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <h1>Zápisník nápadov</h1>
        <div className="auth-card">
          <h2>{authMode === "login" ? "Prihlásenie" : "Registrácia"}</h2>
          {authError && <p className="error">{authError}</p>}
          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" className="btn-add" disabled={authSubmitting}>
              {authSubmitting
                ? "Čakaj..."
                : authMode === "login"
                  ? "Prihlásiť sa"
                  : "Registrovať sa"}
            </button>
          </form>
          <p className="auth-switch">
            {authMode === "login" ? (
              <>
                Nemáš účet?{" "}
                <button onClick={() => { setAuthMode("register"); setAuthError(""); }}>
                  Registrovať sa
                </button>
              </>
            ) : (
              <>
                Máš účet?{" "}
                <button onClick={() => { setAuthMode("login"); setAuthError(""); }}>
                  Prihlásiť sa
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Zápisník nápadov</h1>
        <button className="btn-logout" onClick={handleLogout}>
          Odhlásiť
        </button>
      </div>

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
        <button
          className="btn-new-category"
          onClick={() => setShowCategoryForm(!showCategoryForm)}
          title="Nová kategória"
        >
          +
        </button>
        <button className="btn-add" onClick={addIdea} disabled={!newIdea.trim()}>
          Pridať
        </button>
      </div>

      {showCategoryForm && (
        <div className="category-form">
          <input
            type="text"
            placeholder="Názov novej kategórie..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
          />
          <button className="btn-add" onClick={addCategory} disabled={!newCategoryName.trim()}>
            Pridať
          </button>
          <button className="btn-cancel" onClick={() => { setShowCategoryForm(false); setNewCategoryName(""); }}>
            Zrušiť
          </button>
        </div>
      )}

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
