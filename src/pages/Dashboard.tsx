import { Link } from "react-router-dom";
import { ContinueCard } from "@/components/ContinueCard";
import { Logo } from "@/components/Logo";
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
      <div className="bg-muted/50 mb-6 flex flex-col items-center gap-3 rounded-lg p-6 text-center sm:p-8">
        <Logo className="h-12 w-12" />
        <p className="text-2xl font-bold sm:text-3xl">Git Gud</p>
        <p className="text-muted-foreground max-w-2xl">
          A gamified way to learn Git. Work through bite-sized quizzes on core Git commands, earn
          XP as you go, and track your progress across topics.
        </p>
      </div>
      <h2 className="text-xl font-semibold mb-4">Choose a topic</h2>
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
