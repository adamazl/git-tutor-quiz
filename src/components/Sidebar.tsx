import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

interface SidebarProps {
  progress: ProgressMap;
  topicsMastered: number;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ progress, topicsMastered, open, onClose }: SidebarProps) {
  const percent = Math.round((topicsMastered / topics.length) * 100);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <nav
        aria-label="Topics"
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 overflow-y-auto border-r bg-background p-4 space-y-4 transition-transform duration-200 ease-in-out sm:static sm:z-auto sm:translate-x-0 sm:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
                  onClick={onClose}
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
    </>
  );
}
