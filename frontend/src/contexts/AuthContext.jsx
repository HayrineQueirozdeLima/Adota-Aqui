import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CHAVE = "adotaaqui.sessao";
const LIMITE_DO_TIMER = 2147483647;

const AuthContext = createContext(null);

// A sessão fica no localStorage quando a pessoa marca "Manter conta conectada"
// (sobrevive a fechar o navegador) e no sessionStorage quando não marca (acaba ao fechar a aba).
// Sessão com o token vencido é descartada, a API já não aceitaria mais.
function lerSessaoSalva() {
  for (const armazenamento of [localStorage, sessionStorage]) {
    try {
      const sessao = JSON.parse(armazenamento.getItem(CHAVE));
      if (sessao && new Date(sessao.expiraEm) > new Date()) return sessao;
    } catch {
      // JSON estragado cai no removeItem de baixo
    }
    armazenamento.removeItem(CHAVE);
  }
  return null;
}

// Guarda quem está logado e deixa isso disponível pra qualquer tela, via useAuth()
export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva);

  const sair = useCallback(() => {
    localStorage.removeItem(CHAVE);
    sessionStorage.removeItem(CHAVE);
    setSessao(null);
  }, []);

  // novaSessao é a resposta do login ou do cadastro: { token, tipoConta, id, nome, expiraEm }
  const entrar = useCallback((novaSessao, manterConectada = false) => {
    localStorage.removeItem(CHAVE);
    sessionStorage.removeItem(CHAVE);
    const armazenamento = manterConectada ? localStorage : sessionStorage;
    armazenamento.setItem(CHAVE, JSON.stringify(novaSessao));
    setSessao(novaSessao);
  }, []);

  // Quando o token vence (24 h), encerra a sessão sozinho
  useEffect(() => {
    if (!sessao) return undefined;
    const restante = new Date(sessao.expiraEm) - Date.now();
    // O setTimeout não aceita esperar mais que uns 24 dias, acima disso ele dispara na hora
    if (restante > LIMITE_DO_TIMER) return undefined;
    const timer = setTimeout(sair, Math.max(restante, 0));
    return () => clearTimeout(timer);
  }, [sessao, sair]);

  const valor = useMemo(
    () => ({
      usuario: sessao
        ? { id: sessao.id, nome: sessao.nome, tipoConta: sessao.tipoConta }
        : null,
      token: sessao?.token ?? null,
      entrar,
      sair,
    }),
    [sessao, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error(
      "useAuth precisa estar dentro do <AuthProvider> (ver App.jsx)",
    );
  }
  return contexto;
}
