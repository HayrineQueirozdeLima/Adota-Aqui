import VitrineAnimais from "../../components/VitrineAnimais/VitrineAnimais";

export default function ListaAnimais() {
  return (
    <main className="px-4 py-8 md:px-14">
      <h1 className="mb-6 font-titulo font-semibold text-display text-texto-principal">
        Animais para adoção
      </h1>
      <VitrineAnimais />
    </main>
  );
}
