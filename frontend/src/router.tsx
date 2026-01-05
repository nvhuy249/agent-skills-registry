import { createBrowserRouter } from "react-router-dom";
import AppAuth from "./AppAuth";
import App from "./App";

import Login from "./pages/Login";
import MySkills from "./pages/MySkills";
// import PublicSkills from "./pages/PublicSkills";
// import UploadSkill from "./pages/UploadSkill";

export const router = createBrowserRouter([
  {
    element: <AppAuth />,
    children: [
      { path: "/login", element: <Login /> },
    ],
  },
  {
    element: <App />,
    children: [
      { path: "/", element: <div>Home</div> },
      { path: "/skills", element: <MySkills /> },
      // { path: "/public", element: <PublicSkills /> },
      // { path: "/upload", element: <UploadSkill /> },
    ],
  },
]);