import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";

type Month = { id: string; year: number; month: number; name: string; createdAt: string };
type Expense = { id: string; monthId: string; categoryId: string; amount: number; date: string; note?: string };

export default function Home() {
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/months")
      .then((r) => r.json())
      .then((data) => {
        setMonths(data.months || []);
        if (data.months && data.months.length) setSelectedMonth(data.months[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    setLoading(true);
    fetch(`/api/months/${selectedMonth}/expenses`)
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses || []))
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const totalBudget = 1700; // placeholder until budgets endpoint implemented
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = totalBudget - totalExpenses;

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finance & Expense Tracker</h1>
        <div>
          <select className="bg-[#081224] px-3 py-2 rounded" value={selectedMonth ?? ""} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || `${m.month}/${m.year}`}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Monthly Budget" value={`$${totalBudget.toFixed(2)}`} sub="Target for active period" />
        <StatCard title="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} sub={`${((totalExpenses / totalBudget) * 100).toFixed(1)}% of monthly budget used`} />
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
          <h3 className="text-lg font-semibold mb-4">Charts (placeholder)</h3>
          <div className="h-48 flex items-center justify-center text-gray-400">Donut / Budget vs Actual / Daily trend will be here</div>
        </div>
      </section>
    </div>
  );
}
