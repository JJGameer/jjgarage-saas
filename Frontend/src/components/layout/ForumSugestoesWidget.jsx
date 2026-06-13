import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  addSugestao,
  aprovarSugestao,
  eliminarSugestao,
  fetchSugestoes,
} from "../../services/api.js";

const MENSAGEM_SUCESSO =
  "Sugestão enviada com sucesso! Ficará visível assim que for revista pelo administrador.";

const formatarDataRelativa = (dataStr) => {
  const data = new Date(dataStr);
  const agora = new Date();
  const diffMs = agora - data;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `há ${diffDias}d`;

  return data.toLocaleDateString("pt-PT");
};

const obterAutor = (sugestao) =>
  sugestao.Utilizador === "Admin"
    ? "Admin"
    : `Utilizador #${sugestao.Utilizador}`;

const ForumSugestoesWidget = () => {
  const [aberto, setAberto] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [meuNumero, setMeuNumero] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [texto, setTexto] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [aModerar, setAModerar] = useState(null);
  const [erro, setErro] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");
  const listaRef = useRef(null);
  const sucessoTimeoutRef = useRef(null);

  const carregarSugestoes = useCallback(async () => {
    setACarregar(true);
    setErro("");

    try {
      const data = await fetchSugestoes();
      setSugestoes(data.sugestoes || []);
      setMeuNumero(data.meuNumeroAnonimo ?? null);
      setIsAdmin(Boolean(data.isAdmin));
    } catch (error) {
      setErro(error.message || "Não foi possível carregar as sugestões.");
    } finally {
      setACarregar(false);
    }
  }, []);

  useEffect(() => {
    if (aberto) {
      carregarSugestoes();
    }
  }, [aberto, carregarSugestoes]);

  useEffect(() => {
    return () => {
      if (sucessoTimeoutRef.current) {
        clearTimeout(sucessoTimeoutRef.current);
      }
    };
  }, []);

  const mostrarSucesso = () => {
    setSucessoMsg(MENSAGEM_SUCESSO);

    if (sucessoTimeoutRef.current) {
      clearTimeout(sucessoTimeoutRef.current);
    }

    sucessoTimeoutRef.current = setTimeout(() => {
      setSucessoMsg("");
    }, 5000);
  };

  const handleEnviar = async (e) => {
    e.preventDefault();

    const textoLimpo = texto.trim();
    if (!textoLimpo || aEnviar) return;

    setAEnviar(true);
    setErro("");

    try {
      await addSugestao(textoLimpo);
      setTexto("");

      if (!isAdmin) {
        mostrarSucesso();
      }

      await carregarSugestoes();

      if (listaRef.current) {
        listaRef.current.scrollTop = 0;
      }
    } catch (error) {
      setErro(error.message || "Não foi possível publicar a sugestão.");
    } finally {
      setAEnviar(false);
    }
  };

  const handleAprovar = async (id) => {
    if (aModerar) return;

    setAModerar(id);
    setErro("");

    try {
      await aprovarSugestao(id);
      await carregarSugestoes();
    } catch (error) {
      setErro(error.message || "Não foi possível aprovar a sugestão.");
    } finally {
      setAModerar(null);
    }
  };

  const handleEliminar = async (id) => {
    if (aModerar) return;

    setAModerar(id);
    setErro("");

    try {
      await eliminarSugestao(id);
      setSugestoes((prev) => prev.filter((s) => s.Id !== id));
    } catch (error) {
      setErro(error.message || "Não foi possível eliminar a sugestão.");
    } finally {
      setAModerar(null);
    }
  };

  return (
    <>
      {aberto && (
        <div
          className="forum-panel"
          role="dialog"
          aria-label="Fórum de Sugestões"
        >
          <div className="forum-panel-header">
            <div>
              <h3>Fórum de Sugestões</h3>
              {isAdmin ? (
                <span className="forum-panel-identidade">Painel de moderação</span>
              ) : (
                meuNumero && (
                  <span className="forum-panel-identidade">
                    Tu és o Utilizador #{meuNumero}
                  </span>
                )
              )}
            </div>
            <button
              type="button"
              className="forum-panel-fechar"
              onClick={() => setAberto(false)}
              aria-label="Fechar fórum"
            >
              ×
            </button>
          </div>

          <div className="forum-panel-lista" ref={listaRef}>
            {aCarregar && (
              <p className="forum-panel-estado">A carregar sugestões...</p>
            )}

            {!aCarregar && sugestoes.length === 0 && (
              <div className="forum-panel-vazio">
                <p>Ainda não há sugestões.</p>
                <span>
                  {isAdmin
                    ? "Não existem sugestões pendentes ou aprovadas."
                    : "Sê o primeiro a partilhar uma ideia para melhorar a plataforma."}
                </span>
              </div>
            )}

            {!aCarregar &&
              sugestoes.map((s) => (
                <article
                  key={s.Id}
                  className={`forum-sugestao${s.Minha ? " minha" : ""}${!s.Aprovada ? " pendente" : ""}`}
                >
                  <div className="forum-sugestao-cabecalho">
                    <span
                      className={`forum-sugestao-autor${s.Utilizador === "Admin" ? " admin" : ""}`}
                    >
                      {obterAutor(s)}
                    </span>
                    {s.Minha && s.Utilizador !== "Admin" && (
                      <span className="forum-sugestao-badge">A tua</span>
                    )}
                    {isAdmin && !s.Aprovada && (
                      <span className="forum-sugestao-badge pendente">Pendente</span>
                    )}
                    <span className="forum-sugestao-data">
                      {formatarDataRelativa(s.DataCriacao)}
                    </span>
                  </div>

                  <p className="forum-sugestao-texto">{s.Texto}</p>

                  {isAdmin && (
                    <div className="forum-moderacao">
                      {!s.Aprovada && (
                        <button
                          type="button"
                          className="forum-btn-aprovar"
                          onClick={() => handleAprovar(s.Id)}
                          disabled={aModerar === s.Id}
                        >
                          Aprovar
                        </button>
                      )}
                      <button
                        type="button"
                        className="forum-btn-eliminar"
                        onClick={() => handleEliminar(s.Id)}
                        disabled={aModerar === s.Id}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </article>
              ))}
          </div>

          {erro && <p className="forum-panel-erro">{erro}</p>}

          <div className="forum-panel-rodape-area">
            {sucessoMsg && (
              <p className="forum-panel-sucesso">{sucessoMsg}</p>
            )}

            <form className="forum-panel-rodape" onSubmit={handleEnviar}>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Partilha a tua sugestão..."
                maxLength={500}
                disabled={aEnviar}
              />
              <button type="submit" disabled={!texto.trim() || aEnviar}>
                {aEnviar ? "..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`forum-fab${aberto ? " aberto" : ""}`}
        onClick={() => setAberto((prev) => !prev)}
        title={aberto ? "Fechar fórum" : "Fórum de Sugestões"}
        aria-label={
          aberto ? "Fechar fórum de sugestões" : "Abrir fórum de sugestões"
        }
      >
        {aberto ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="12" y1="7" x2="12" y2="13" />
          </svg>
        )}
      </button>
    </>
  );
};

export default ForumSugestoesWidget;
