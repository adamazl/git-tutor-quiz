import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

interface SidebarProps {
  progress: ProgressMap;
  topicsMastered: number;
}

export function Sidebar({ progress, topicsMastered }: SidebarProps) {
  const percent = Math.round((topicsMastered / topics.length) * 100);

  return (
    <nav className="w-64 shrink-0 border-r p-4 space-y-4" aria-label="Topics">
      <div>
        <p className="text-sm font-medium mb-1">Overall progress</p>
        <Progress value={percent} />
        <p className="text-xs text-muted-foreground mt-1">
          {topicsMastered} / {topics.length} topics mastered
        </p>
      </div>
      <ul className="space-y-1">
        {topics.map((topic) => {
          const p = progress[topic.id];
          return (
            <li key={topic.id}>
              <NavLink
                to={`/topic/${topic.id}`}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted ${
                    isActive ? "bg-muted font-medium" : ""
                  }`
                }
              >
                <span>{topic.title}</span>
                {p?.completed ? (
                  <Badge>✓</Badge>
                ) : p ? (
                  <Badge variant="secondary">
                    {p.bestScore}/{p.totalQuestions}
                  </Badge>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
