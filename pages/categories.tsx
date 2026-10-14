import { useEffect, useState } from "react";

export default function CategoriesPage(){
  const [categories,setCategories] = useState<any[]>([]);
  const [showDeleted,setShowDeleted] = useState(false);
  const [newName,setNewName] = useState('');
  const [editing, setEditing] = useState<{id:string,name:string,color:string} | null>(null);

  useEffect(()=>{
    fetch(`/api/categories?includeDeleted=${showDeleted}`).then(r=>r.json()).then(d=>setCategories(d.categories||[]));
  },[showDeleted]);

  async function createCategory(){
    if(!newName.trim()) return;
    const res = await fetch('/api/categories',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:newName})});
    const d = await res.json();
    if(d.ok){ setNewName(''); setCategories(c=>[d.category,...c]); }
  }

  async function softDelete(id:string){
    if(!confirm('Delete category? This will mark it deleted and reassign expenses if you later remove.')) return;
    const res = await fetch(`/api/categories/${id}`,{method:'DELETE'});
    const d = await res.json();
    if(d.ok) setCategories(c=>c.filter(x=>x.id!==id));
  }

  async function restore(id:string){
    const res = await fetch(`/api/categories/${id}`,{method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ deleted: false })});
    const d = await res.json();
    if(d.ok) {
      setCategories(c=>c.filter(x=>x.id!==id));
    }
  }

  async function saveEdit(){
    if(!editing) return;
    const res = await fetch(`/api/categories/${editing.id}`,{method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: editing.name, color: editing.color })});
    const d = await res.json();
    if(d.ok){ setEditing(null); setCategories(c=>c.map(x=> x.id===editing.id? d.category : x)); }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Show deleted</label>
          <input type="checkbox" checked={showDeleted} onChange={(e)=>setShowDeleted(e.target.checked)} />
        </div>
      </header>

      <div className="card p-4 mb-4">
        <div className="flex gap-2">
          <input value={newName} onChange={(e)=>setNewName(e.target.value)} className="bg-[#0b1220] p-2 rounded flex-1" placeholder="New category" />
          <button className="bg-emerald-600 px-4 rounded" onClick={createCategory}>Add</button>
        </div>
      </div>

      <div className="grid gap-2">
        {categories.map(c=> (
          <div key={c.id} className="card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{width:18,height:18,background:c.color||'#9ca3af',borderRadius:8}}></div>
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-400">{c.id}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {c.deleted ? <button className="bg-green-600 px-3 rounded" onClick={()=>restore(c.id)}>Restore</button> : <button className="bg-red-600 px-3 rounded" onClick={()=>softDelete(c.id)}>Delete</button>}
              <button className="bg-sky-600 px-3 rounded" onClick={()=>setEditing({id:c.id,name:c.name,color:c.color||'#60a5fa'})}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#081224] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input className="w-full bg-[#0b1220] px-3 py-2 rounded" value={editing.name} onChange={(e)=>setEditing({...editing, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1">Color (hex)</label>
                <input className="w-full bg-[#0b1220] px-3 py-2 rounded" value={editing.color} onChange={(e)=>setEditing({...editing, color: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded bg-gray-600" onClick={()=>setEditing(null)}>Cancel</button>
                <button className="px-4 py-2 rounded bg-emerald-600" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
