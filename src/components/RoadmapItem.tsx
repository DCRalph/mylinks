import { type ReactNode } from "react";

type Status = "completed" | "in-progress" | "planned";

interface RoadmapItemProps {
  title: string;
  description: string;
  status: Status;
  icon: ReactNode;
}

const statusConfig = {
  completed: {
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    label: "Completed",
  },
  "in-progress": {
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    label: "In Progress",
  },
  planned: {
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400",
    label: "Planned",
  },
};

export default function RoadmapItem({
  title,
  description,
  status,
  icon,
}: RoadmapItemProps) {
  const { bgColor, textColor, label } = statusConfig[status];

  return (
    <div className="flex w-full items-center px-6 py-4">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${status === "completed" ? "bg-green-500/20" : status === "in-progress" ? "bg-blue-500/20" : "bg-purple-500/20"}`}
      >
        {icon}
      </div>
      <div className="ml-4 flex-grow">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <span
        className={`ml-4 inline-flex items-center whitespace-nowrap rounded-full ${bgColor} px-3 py-1 text-sm font-medium ${textColor}`}
      >
        {label}
      </span>
    </div>
  );
}
