// src/App.tsx
import React from "react";
import Home from "./pages/Home";
import Game from "./pages/Game";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      // children: [{ path: "/game", element: <Game /> }],
    },
  ]);
  return <RouterProvider router={router} />;
}
export default App;
