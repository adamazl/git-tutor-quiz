import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DiagramRenderer } from "@/components/gitgraphs/DiagramRenderer";
import { Quiz } from "@/components/Quiz";
import { topics } from "@/data/topics";

interface TopicPageProps {
  onQuizComplete: (topicId: string, score: number, totalQuestions: number) => void;
}

export function TopicPage({ onQuizComplete }: TopicPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const topic = topics.find((t) => t.id === id);

  if (!topic) {
    return (
      <div className="p-6">
        <p>Topic not found.</p>
        <Link to="/" className="underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{topic.title}</h2>
        {topic.explanation.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mt-2 text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {topic.diagrams.map((kind) => (
          <DiagramRenderer key={kind} kind={kind} />
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-3">Quiz</h3>
        <Quiz
          questions={topic.quiz}
          onComplete={(score) => onQuizComplete(topic.id, score, topic.quiz.length)}
        />
      </div>

      <Button variant="outline" onClick={() => navigate("/")}>
        Back to dashboard
      </Button>
    </div>
  );
}
