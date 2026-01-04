import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import MySkills from "./pages/MySkills";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <div>Home</div> },
      { path: "/login", element: <Login /> },
      { path: "/skills", element: <MySkills /> },
    ],
  },
]);
