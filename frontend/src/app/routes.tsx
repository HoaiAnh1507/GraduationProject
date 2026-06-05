import { createBrowserRouter } from "react-router";
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
      { path: "study-materials", Component: StudyMaterialsPage },
      { path: "flashcards", Component: FlashcardsPage },
      { path: "study/:deckId", Component: StudyPage },
      { path: "lesson/:topicId", Component: LessonPage },
      { path: "profile", Component: ProfilePage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
