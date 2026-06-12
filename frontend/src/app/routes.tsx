import { createBrowserRouter } from "react-router";
import type { ReactNode } from "react";
import { Root } from "./components/Root";
import { HomePage } from "./components/HomePage";
import { ChatPageWrapper } from "./components/ChatPageWrapper";
import { FlashcardsPage } from "./components/FlashcardsPage";
import { StudyPage } from "./components/StudyPage";
import { LoginPage } from "./components/LoginPage";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { StudyMaterialsPage } from "./components/StudyMaterialsPage";
import { LessonPage } from "./components/LessonPage";
import { AuthRequired } from "./components/AuthRequired";
import { useAuth } from "./context/AuthContext";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <AuthRequired />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: ChatPageWrapper },
      { path: "home", Component: HomePage },
      { path: "chat", Component: ChatPageWrapper },
      { path: "study-materials", element: <RequireAuth><StudyMaterialsPage /></RequireAuth> },
      { path: "flashcards", element: <RequireAuth><FlashcardsPage /></RequireAuth> },
      { path: "study/:deckId", element: <RequireAuth><StudyPage /></RequireAuth> },
      { path: "lesson/:topicId", element: <RequireAuth><LessonPage /></RequireAuth> },
      { path: "profile", Component: ProfilePage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
