import CardAnimal from "../../components/CardAnimal/CardAnimal";
import { animaisExemplo } from "../../mocks/animais";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="mb-6 font-titulo font-semibold text-display">
        Adota Aqui
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {animaisExemplo.map((animal) => (
          <CardAnimal key={animal.id} animal={animal} />
        ))}
      </div>
    </main>
  );
}
