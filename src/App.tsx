import { Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { TopicPage } from "@/pages/TopicPage";
import { useProgress } from "@/lib/progress";
import { useAuth, signOutUser } from "@/lib/auth";
import { topics } from "@/data/topics";

export function App() {
  const { user } = useAuth();
  const { progress, recordResult, stats } = useProgress(topics.length, user);

  function handleQuizComplete(topicId: string, score: number, totalQuestions: number) {
    recordResult(topicId, score, totalQuestions);
    if (score === totalQuestions) {
      toast.success("Topic mastered! 🎉");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header totalXp={stats.totalXp} user={user} onSignOut={signOutUser} />
      <div className="flex flex-1">
        <Sidebar progress={progress} topicsMastered={stats.topicsMastered} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard progress={progress} />} />
            <Route path="/topic/:id" element={<TopicPage onQuizComplete={handleQuizComplete} />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
