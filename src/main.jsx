import React from "react";
import { createRoot } from "react-dom/client";
import PostureCoach from "../PostureCoach.jsx";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        margin: 0,
        background: "#f8fafc",
      }}
    >
      <PostureCoach />
    </main>
  </React.StrictMode>,
);
