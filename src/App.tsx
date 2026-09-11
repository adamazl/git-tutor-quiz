import { useState } from "react";
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
  const { progress, unlockedTopics, recordResult, resetProgress, unlockTopic, stats, credits } =
    useProgress(topics.length, user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleQuizComplete(topicId: string, score: number, totalQuestions: number) {
    recordResult(topicId, score, totalQuestions);
    if (score === totalQuestions) {
      toast.success("Topic mastered! 🎉");
    }
  }

  async function handleUnlock(topicId: string) {
    const result = await unlockTopic(topicId);
    if (!result.ok) {
      const message =
        result.reason === "insufficient-credits"
          ? "Not enough credits to unlock this topic."
          : result.reason === "sign-in-required"
            ? "Sign in to unlock this topic."
            : "Couldn't unlock this topic. Try again.";
      toast.error(message);
      return;
    }
    toast.success("Topic unlocked! 🔓");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        totalXp={stats.totalXp}
        credits={credits}
        user={user}
        onSignOut={signOutUser}
        onResetProgress={resetProgress}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1">
        <Sidebar
          progress={progress}
          topicsMastered={stats.topicsMastered}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  progress={progress}
                  unlockedTopics={unlockedTopics}
                  credits={credits}
                  signedIn={Boolean(user)}
                  onUnlock={handleUnlock}
                />
              }
            />
            <Route
              path="/topic/:id"
              element={<TopicPage unlockedTopics={unlockedTopics} onQuizComplete={handleQuizComplete} />}
            />
          </Routes>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
