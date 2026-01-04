import { useEffect } from "react";

export default function MySkills() {
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(console.log);
  }, []);
  
  return (
    <div>
      <h2>My Skills Page</h2>
      <p>This is where the my skills will appear.</p>
    </div>
  );
}