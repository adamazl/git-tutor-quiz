import { Link } from "react-router-dom";
import { ContinueCard } from "@/components/ContinueCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

interface DashboardProps {
  progress: ProgressMap;
}

export function Dashboard({ progress }: DashboardProps) {
  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Choose a topic</h2>
      <p className="text-muted-foreground mb-4 max-w-2xl">
        Git Gud is a gamified way to learn Git. Work through bite-sized quizzes on core Git
        commands, earn XP as you go, and track your progress across topics.
      </p>
      <ContinueCard progress={progress} />
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
                <Button
                  render={<Link to={`/topic/${topic.id}`} />}
                  nativeButton={false}
                  variant={p?.completed ? "secondary" : "default"}
                >
                  {label}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
