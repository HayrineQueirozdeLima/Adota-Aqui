import { useState } from "react";

// Foto grande + miniaturas (Figma: "Ficha do animal").
// Clicar numa miniatura troca a foto grande. Com uma foto só, as miniaturas nem aparecem.
export default function GaleriaFotos({ nome, fotos }) {
    const [escolhida, setEscolhida] = useState(0);

    if (fotos.length === 0) {
        return (
            <div className="flex aspect-[4/3] items-center justify-center rounded-[16px] bg-marca-roxo-suave">
                <span className="text-legenda text-texto-terciario">foto · {nome}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <img
                src={fotos[escolhida]}
                alt={`Foto ${escolhida + 1} de ${fotos.length} de ${nome}`}
                className="aspect-[4/3] w-full rounded-[16px] bg-marca-roxo-suave object-cover"
            />
            {fotos.length > 1 && (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {fotos.map((url, posicao) => (
                        <li key={url}>
                            <button
                                type="button"
                                onClick={() => setEscolhida(posicao)}
                                aria-label={`Ver foto ${posicao + 1} de ${fotos.length}`}
                                aria-pressed={posicao === escolhida}
                                className={`block w-full overflow-hidden rounded-[12px] border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo ${posicao === escolhida ? "border-marca-roxo" : "border-transparent"
                                    }`}
                            >
                                <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}