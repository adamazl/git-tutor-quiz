import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

interface DashboardProps {
  progress: ProgressMap;
}

export function Dashboard({ progress }: DashboardProps) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Choose a topic</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => {
          const p = progress[topic.id];
          const label = p?.completed ? "Review" : p ? "Continue" : "Start";
          return (
            <Card key={topic.id}>
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
                <CardDescription>{topic.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant={p?.completed ? "secondary" : "default"}>
                  <Link to={`/topic/${topic.id}`}>{label}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
