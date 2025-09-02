import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Welcome to the Home Page</h1>
      <Link className="btn btn-primary" href="/albums">Albums</Link>
    </main>
  );
}
