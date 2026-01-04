import { useEffect } from "react";

export default function Login() {
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(console.log);
  }, []);

  return (
    <div>
      <h2>Login Page</h2>
      <p>This is where the login form will go.</p>
    </div>
  );
}