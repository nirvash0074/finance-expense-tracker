import React, { useEffect, useState } from "react";

export default function CategorySelector({ value, onChange, allowCreate = true }: { value?: string; onChange: (id: string) => void; allowCreate?: boolean }) {
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .finally(() => setLoading(false));
  }, []);

  async function createCategory() {
    if (!newName.trim()) return;
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    const d = await res.json();
    if (d.ok) {
      setCategories((c) => [d.category, ...c]);
      setNewName("");
      onChange(d.category.id);
    }
  }

  return (
    <div>
      <select className="bg-[#081224] px-3 py-2 rounded w-full" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {allowCreate && (
        <div className="mt-2 flex gap-2">
          <input className="flex-1 bg-[#081224] px-3 py-2 rounded" placeholder="New category" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="bg-green-500 px-3 py-2 rounded" onClick={createCategory}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
