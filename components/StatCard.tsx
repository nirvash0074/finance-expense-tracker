import React from "react";

export default function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="card w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">{title}</div>
          <div className="text-2xl font-semibold mt-2">{value}</div>
          {sub ? <div className="text-xs text-gray-400 mt-1">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}
