import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Daily Outflow",
        data: values,
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6,182,212,0.2)",
        fill: true,
        tension: 0.2,
      },
    ],
  };
  return <Line data={data} />;
}
