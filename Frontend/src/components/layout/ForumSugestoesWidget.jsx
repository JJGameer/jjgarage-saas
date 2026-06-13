import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  addSugestao,
  fetchSugestoes,
  votarSugestao,
} from "../../services/api.js";

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

const ForumSugestoesWidget = () => {
  const [aberto, setAberto] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [meuNumero, setMeuNumero] = useState(null);
  const [ordenar, setOrdenar] = useState("recentes");
  const [texto, setTexto] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [aVotar, setAVotar] = useState(null);
  const [erro, setErro] = useState("");
  const listaRef = useRef(null);

  const carregarSugestoes = useCallback(async () => {
    setACarregar(true);
    setErro("");

    try {
      const data = await fetchSugestoes(ordenar);
      setSugestoes(data.sugestoes || []);
      setMeuNumero(data.meuNumeroAnonimo ?? null);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar as sugestões.");
    } finally {
      setACarregar(false);
    }
  }, [ordenar]);

  useEffect(() => {
    if (aberto) {
      carregarSugestoes();
    }
  }, [aberto, carregarSugestoes]);

  const handleEnviar = async (e) => {
    e.preventDefault();

    const textoLimpo = texto.trim();
    if (!textoLimpo || aEnviar) return;

    setAEnviar(true);
    setErro("");

    try {
      await addSugestao(textoLimpo);
      setTexto("");
      setOrdenar("recentes");

      const data = await fetchSugestoes("recentes");
      setSugestoes(data.sugestoes || []);
      setMeuNumero(data.meuNumeroAnonimo ?? null);

      if (listaRef.current) {
        listaRef.current.scrollTop = 0;
      }
    } catch (error) {
      setErro(error.message || "Não foi possível publicar a sugestão.");
    } finally {
      setAEnviar(false);
    }
  };

  const handleVoto = async (id, tipo) => {
    if (aVotar === id) return;

    setAVotar(id);
    setErro("");

    try {
      const resultado = await votarSugestao(id, tipo);

      setSugestoes((prev) =>
        prev.map((s) =>
          s.Id === id
            ? {
                ...s,
                Likes: resultado.Likes,
                Dislikes: resultado.Dislikes,
                MeuVoto: resultado.MeuVoto,
              }
            : s,
        ),
      );
    } catch (error) {
      setErro(error.message || "Não foi possível registar o voto.");
    } finally {
      setAVotar(null);
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
              {meuNumero && (
                <span className="forum-panel-identidade">
                  Tu és o Utilizador #{meuNumero}
                </span>
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

          <div className="forum-panel-tabs">
            <button
              type="button"
              className={ordenar === "recentes" ? "ativo" : ""}
              onClick={() => setOrdenar("recentes")}
            >
              Recentes
            </button>
            <button
              type="button"
              className={ordenar === "populares" ? "ativo" : ""}
              onClick={() => setOrdenar("populares")}
            >
              Populares
            </button>
          </div>

          <div className="forum-panel-lista" ref={listaRef}>
            {aCarregar && (
              <p className="forum-panel-estado">A carregar sugestões...</p>
            )}

            {!aCarregar && sugestoes.length === 0 && (
              <div className="forum-panel-vazio">
                <p>Ainda não há sugestões.</p>
                <span>Sê o primeiro a partilhar uma ideia para melhorar a plataforma.</span>
              </div>
            )}

            {!aCarregar &&
              sugestoes.map((s) => (
                <article
                  key={s.Id}
                  className={`forum-sugestao${s.Minha ? " minha" : ""}`}
                >
                  <div className="forum-sugestao-cabecalho">
                    <span className="forum-sugestao-autor">
                      Utilizador #{s.Utilizador}
                    </span>
                    {s.Minha && (
                      <span className="forum-sugestao-badge">A tua</span>
                    )}
                    <span className="forum-sugestao-data">
                      {formatarDataRelativa(s.DataCriacao)}
                    </span>
                  </div>

                  <p className="forum-sugestao-texto">{s.Texto}</p>

                  <div className="forum-sugestao-votos">
                    <button
                      type="button"
                      className={`forum-voto like${s.MeuVoto === "like" ? " ativo" : ""}`}
                      onClick={() => handleVoto(s.Id, "like")}
                      disabled={aVotar === s.Id}
                      aria-label="Gostar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                      {s.Likes}
                    </button>

                    <button
                      type="button"
                      className={`forum-voto dislike${s.MeuVoto === "dislike" ? " ativo" : ""}`}
                      onClick={() => handleVoto(s.Id, "dislike")}
                      disabled={aVotar === s.Id}
                      aria-label="Não gostar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                        <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                      </svg>
                      {s.Dislikes}
                    </button>

                    <span className="forum-sugestao-score">
                      {s.Likes - s.Dislikes > 0 ? "+" : ""}
                      {s.Likes - s.Dislikes}
                    </span>
                  </div>
                </article>
              ))}
          </div>

          {erro && <p className="forum-panel-erro">{erro}</p>}

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
      )}

      <button
        type="button"
        className={`forum-fab${aberto ? " aberto" : ""}`}
        onClick={() => setAberto((prev) => !prev)}
        title={aberto ? "Fechar fórum" : "Fórum de Sugestões"}
        aria-label={aberto ? "Fechar fórum de sugestões" : "Abrir fórum de sugestões"}
      >
        {aberto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
