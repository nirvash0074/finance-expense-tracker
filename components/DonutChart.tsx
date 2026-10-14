import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data }: { data: { labels: string[]; values: number[]; colors?: string[] } }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.colors || ["#ef4444", "#f59e0b", "#10b981", "#60a5fa", "#a78bfa", "#f472b6"],
      },
    ],
  };

  return <Doughnut data={chartData} />;
}
