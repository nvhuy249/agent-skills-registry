import { createBrowserRouter } from "react-router-dom";
import AppAuth from "./AppAuth";
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import MySkills from "./pages/MySkills";
import PublicSkills from "./pages/PublicSkills";
import EditSkill from "./pages/EditSkill";

export const router = createBrowserRouter([
  {
    element: <AppAuth />,
    children: [
      { path: "/login", 
        element: <Login /> },
    ],
  },
  {
    element: <App />,
    children: [
      { path: "/", element: 
      <div className="h-full flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
        <h2 className="text-xl font-semibold tracking-tight">Agent Skills Registry</h2>
        <p className="mt-2 text-slate-400">
          Manage and browse skills. Use the navbar to navigate.
        </p>
      </div>   },
      { path: "/public", element: <PublicSkills /> },
      { path: "/skills", element: <ProtectedRoute><MySkills /></ProtectedRoute> },
      { path: "/skills/:id/edit", element: <ProtectedRoute><EditSkill /></ProtectedRoute> },
    ],
  },
]);
