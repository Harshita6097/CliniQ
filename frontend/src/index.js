import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'inherit', fontSize: '0.875rem', maxWidth: '380px' },
            success: { iconTheme: { primary: '#5a8a57', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#b94040', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
