export default function Home() {
  return (
    <main style={{fontFamily:'ui-sans-serif,system-ui',padding:24}}>
      <h1>Transformers Diagnostic Agent</h1>
      <p>Backend is live.</p>
      <p><a href="/api/health">Health check</a> • <a href="/api/analyze">Analyze (POST)</a></p>
    </main>
  );
}