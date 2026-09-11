import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";
import { isTopicUnlocked } from "@/lib/credits";

interface ContinueCardProps {
  progress: ProgressMap;
  unlockedTopics?: string[];
}

export function ContinueCard({ progress, unlockedTopics = [] }: ContinueCardProps) {
  // Only ever recommend a topic the user can actually open -- a locked
  // topic isn't a valid "continue" or "start next" suggestion.
  const availableTopics = topics.filter((topic) => isTopicUnlocked(topic, unlockedTopics));
  const hasAnyProgress = Object.keys(progress).length > 0;
  const allCompleted = availableTopics.every((topic) => progress[topic.id]?.completed);

  if (allCompleted) {
    return (
      <Card className="ring-primary/30 mb-4">
        <CardHeader>
          <CardTitle>You&rsquo;ve mastered every topic! 🎉</CardTitle>
          <CardDescription>Come back anytime to review a topic and improve your score.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!hasAnyProgress) return null;

  const nextTopic =
    availableTopics.find((topic) => progress[topic.id] && !progress[topic.id].completed) ??
    availableTopics.find((topic) => !progress[topic.id]);
  if (!nextTopic) return null;

  const p = progress[nextTopic.id];

  return (
    <Card className="ring-primary/30 mb-4">
      <CardHeader>
        <CardTitle>Continue where you left off</CardTitle>
        <CardDescription>
          {nextTopic.title} &mdash; {nextTopic.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Button render={<Link to={`/topic/${nextTopic.id}`} />} nativeButton={false}>
          {p ? "Continue" : "Start"}
        </Button>
        {p && (
          <Badge variant="secondary">
            {p.bestScore}/{p.totalQuestions}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
