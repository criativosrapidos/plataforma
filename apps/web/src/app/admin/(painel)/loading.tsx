export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-pulse">
      <div className="mb-5 h-10 w-64 rounded-lg bg-linha/70" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[92px] rounded-2xl border border-linha bg-branco" />
        ))}
      </div>
      <div className="h-96 rounded-2xl border border-linha bg-branco" />
    </div>
  );
}
