// src/App.tsx
import React from "react";
import Home from "./pages/Home";
import Game from "./pages/Game";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RoomProvider } from "./context/RoomDataContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      // children: [{ path: "/game", element: <Game /> }],
    },
  ]);
  return (
    <RoomProvider>
      <RouterProvider router={router} />;
    </RoomProvider>
  );
}
export default App;
