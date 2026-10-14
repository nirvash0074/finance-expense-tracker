import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import CategorySelector from "../components/CategorySelector";
import DonutChart from "../components/DonutChart";
import LineChart from "../components/LineChart";

type Month = { id: string; year: number; month: number; name: string; createdAt: string };
type Expense = { id: string; monthId: string; categoryId: string; amount: number; date: string; note?: string };

type Budget = { id: string; monthId: string; categoryId: string; amount: number };

export default function Home() {
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);

  // form
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, { name: string; color: string }>>({});

  useEffect(() => {
    fetch("/api/months")
      .then((r) => r.json())
      .then((data) => {
        setMonths(data.months || []);
        if (data.months && data.months.length) setSelectedMonth(data.months[0].id);
      });
  }, []);

  useEffect(() => {
    fetch('/api/categories').then(r=>r.json()).then(d=>{
      const map: any = {};
      (d.categories||[]).forEach((c: any)=>map[c.id] = { name: c.name, color: c.color });
      setCategoriesMap(map);
    })
  },[])

  useEffect(() => {
    if (!selectedMonth) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/months/${selectedMonth}/expenses`).then((r) => r.json()),
      fetch(`/api/months/${selectedMonth}/budgets`).then((r) => r.json()),
    ])
      .then(([expRes, budRes]) => {
        setExpenses(expRes.expenses || []);
        setBudgets(budRes.budgets || []);
      })
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  async function submitExpense(e: any) {
    e.preventDefault();
    if (!selectedMonth) return alert("Select month");
    if (!categoryId) return alert("Select category");
    if (!amount || Number(amount) <= 0) return alert("Enter amount");
    if (!date) return alert("Enter date");
    const res = await fetch(`/api/months/${selectedMonth}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, amount: Number(amount), date, note }),
    });
    const d = await res.json();
    if (d.ok) {
      // refresh
      const exp = await fetch(`/api/months/${selectedMonth}/expenses`).then((r) => r.json());
      setExpenses(exp.expenses || []);
      setShowAdd(false);
      setAmount("");
      setDate("");
      setNote("");
      setCategoryId("");
    } else {
      alert(d.error || "Failed to add expense");
    }
  }

  // Budgets editor
  function openBudgetEditor() {
    setShowBudget(true);
  }

  async function saveBudgets(edited: { categoryId: string; amount: number; id?: string }[]) {
    if (!selectedMonth) return;
    for (const b of edited) {
      if (b.id) {
        // update
        await fetch(`/api/budgets/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: b.amount }) });
      } else {
        // create
        await fetch(`/api/months/${selectedMonth}/budgets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: b.categoryId, amount: b.amount }) });
      }
    }
    // refresh
    const bRes = await fetch(`/api/months/${selectedMonth}/budgets`).then((r) => r.json());
    setBudgets(bRes.budgets || []);
    setShowBudget(false);
  }

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = totalBudget - totalExpenses;

  // prepare donut data
  const categorySums: Record<string, number> = {};
  expenses.forEach((e) => {
    if (!categorySums[e.categoryId]) categorySums[e.categoryId] = 0;
    categorySums[e.categoryId] += e.amount || 0;
  });
  const donutLabels = Object.keys(categorySums).map((id) => categoriesMap[id]?.name || id);
  const donutValues = Object.keys(categorySums).map((id) => categorySums[id]);
  const donutColors = Object.keys(categorySums).map((id) => categoriesMap[id]?.color || '#60a5fa');

  // daily trend: group by day of month
  const dayMap: Record<string, number> = {};
  expenses.forEach((e)=>{
    const d = e.date;
    dayMap[d] = (dayMap[d] || 0) + e.amount;
  })
  const sortedDays = Object.keys(dayMap).sort();
  const dayLabels = sortedDays;
  const dayValues = sortedDays.map(d=>dayMap[d]);

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finance & Expense Tracker</h1>
        <div className="flex items-center gap-4">
          <select className="bg-[#081224] px-3 py-2 rounded" value={selectedMonth ?? ""} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || `${m.month}/${m.year}`}
              </option>
            ))}
          </select>
          <button className="bg-emerald-600 px-4 py-2 rounded" onClick={()=>setShowAdd(true)}>+ Add Record</button>
          <button className="bg-sky-600 px-4 py-2 rounded" onClick={openBudgetEditor}>Budgets</button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Monthly Budget" value={`$${totalBudget.toFixed(2)}`} sub="Target for active period" />
        <StatCard title="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} sub={`${((totalExpenses / (totalBudget || 1)) * 100).toFixed(1)}% of monthly budget used`} />
        <StatCard title="Remaining Budget" value={`$${remaining.toFixed(2)}`} sub={remaining >= 0 ? "Safe" : "Over budget"} />
        <StatCard title="Net Cash Flow" value={`+$${(totalBudget - totalExpenses).toFixed(2)}`} sub={`Income: $${totalBudget.toFixed(2)}`} />
      </main>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 card">
          <h3 className="text-lg font-semibold mb-4">Expenses</h3>
          {loading ? (
            <div>Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-sm text-gray-400">No expenses for this month.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm">
                <tr><th>Date</th><th>Note</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-gray-800">
                    <td className="py-2">{e.date}</td>
                    <td>{e.note}</td>
                    <td className="text-right">${e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          {donutValues.length === 0 ? (
            <div className="text-sm text-gray-400">No expenses logged for this month</div>
          ) : (
            <DonutChart data={{ labels: donutLabels, values: donutValues, colors: donutColors }} />
          )}
        </div>
      </section>

      <section className="mt-6 card">
        <h3 className="text-lg font-semibold mb-4">Daily Expenses Trend</h3>
        {dayValues.length === 0 ? (
          <div className="text-sm text-gray-400">No daily outflow</div>
        ) : (
          <LineChart labels={dayLabels} values={dayValues} />
        )}
      </section>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#081224] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
            <form onSubmit={submitExpense} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Category</label>
                <CategorySelector value={categoryId} onChange={(id)=>setCategoryId(id)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input className="w-full bg-[#0b1220] px-3 py-2 rounded" value={amount} onChange={(e)=>setAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input type="date" className="w-full bg-[#0b1220] px-3 py-2 rounded" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Note</label>
                <input className="w-full bg-[#0b1220] px-3 py-2 rounded" value={note} onChange={(e)=>setNote(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-600" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-emerald-600">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Editor Modal */}
      {showBudget && (
        <BudgetEditor
          budgets={budgets}
          categoriesMap={categoriesMap}
          onClose={() => setShowBudget(false)}
          onSave={saveBudgets}
        />
      )}
    </div>
  );
}

function BudgetEditor({ budgets, categoriesMap, onClose, onSave }: { budgets: Budget[]; categoriesMap: Record<string, { name: string; color: string }>; onClose: () => void; onSave: (edited: { categoryId: string; amount: number; id?: string }[]) => void; }) {
  const [edited, setEdited] = useState(() => {
    // start from existing budgets
    return budgets.map((b) => ({ categoryId: b.categoryId, amount: b.amount || 0, id: b.id }));
  });

  useEffect(() => {
    setEdited(budgets.map((b) => ({ categoryId: b.categoryId, amount: b.amount || 0, id: b.id })));
  }, [budgets]);

  function setAmountFor(categoryId: string, amount: number) {
    setEdited((e) => {
      const found = e.find((x) => x.categoryId === categoryId);
      if (found) {
        return e.map((x) => (x.categoryId === categoryId ? { ...x, amount } : x));
      }
      return [...e, { categoryId, amount }];
    });
  }

  // show categories list - uses categoriesMap keys
  const categoryIds = Object.keys(categoriesMap);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-[#081224] rounded-lg p-6 w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-4">Edit Budgets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto mb-4">
          {categoryIds.length === 0 && <div className="text-gray-400">No categories yet. Create some first.</div>}
          {categoryIds.map((cid) => {
            const existing = budgets.find((b) => b.categoryId === cid);
            const current = edited.find((x) => x.categoryId === cid);
            return (
              <div key={cid} className="flex items-center justify-between bg-[#0b1220] p-3 rounded">
                <div>
                  <div className="text-sm font-medium">{categoriesMap[cid]?.name || cid}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={current?.amount ?? 0} onChange={(e)=>setAmountFor(cid, Number(e.target.value))} className="w-32 bg-[#081224] px-3 py-2 rounded text-right" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-600" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-emerald-600" onClick={()=>onSave(edited)}>Save</button>
        </div>
      </div>
    </div>
  )
}
