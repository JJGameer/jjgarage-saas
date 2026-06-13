import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  addMensagemSugestao,
  addSugestao,
  aprovarSugestao,
  eliminarSugestao,
  fetchMensagensSugestao,
  fetchSugestoes,
  votarSugestao,
} from "../../services/api.js";
import { useModal } from "../../context/ModalContext.jsx";

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

const obterAutor = (item) =>
  item.Utilizador === "Admin" ? "Admin" : `Utilizador #${item.Utilizador}`;

const ForumSugestoesWidget = () => {
  const [aberto, setAberto] = useState(false);
  const [vista, setVista] = useState("lista");
  const [sugestoes, setSugestoes] = useState([]);
  const [sugestaoAtiva, setSugestaoAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [meuNumero, setMeuNumero] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [texto, setTexto] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [aCarregarMensagens, setACarregarMensagens] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [aModerar, setAModerar] = useState(null);
  const [aVotar, setAVotar] = useState(null);
  const [erro, setErro] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");
  const listaRef = useRef(null);
  const chatRef = useRef(null);
  const sucessoTimeoutRef = useRef(null);
  const { showModal } = useModal();

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

  const carregarMensagens = useCallback(async (sugestaoId) => {
    setACarregarMensagens(true);
    setErro("");

    try {
      const data = await fetchMensagensSugestao(sugestaoId);
      setMensagens(data.mensagens || []);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar as mensagens.");
    } finally {
      setACarregarMensagens(false);
    }
  }, []);

  useEffect(() => {
    if (aberto && vista === "lista") {
      carregarSugestoes();
    }
  }, [aberto, vista, carregarSugestoes]);

  useEffect(() => {
    if (vista === "chat" && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [vista, mensagens, aCarregarMensagens]);

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

  const voltarLista = () => {
    setVista("lista");
    setSugestaoAtiva(null);
    setMensagens([]);
    setTexto("");
    setErro("");
    carregarSugestoes();
  };

  const abrirChat = async (sugestao) => {
    if (!sugestao.Aprovada) return;

    setSugestaoAtiva(sugestao);
    setVista("chat");
    setTexto("");
    setErro("");
    setMensagens([]);
    await carregarMensagens(sugestao.Id);
  };

  const handleFecharPainel = () => {
    setAberto(false);
    setVista("lista");
    setSugestaoAtiva(null);
    setMensagens([]);
    setTexto("");
    setErro("");
  };

  const handleEnviar = async (e) => {
    e.preventDefault();

    const textoLimpo = texto.trim();
    if (!textoLimpo || aEnviar) return;

    setAEnviar(true);
    setErro("");

    try {
      if (vista === "chat" && sugestaoAtiva) {
        const data = await addMensagemSugestao(sugestaoAtiva.Id, textoLimpo);
        setTexto("");
        setMensagens((prev) => [...prev, data.mensagem]);
        setSugestoes((prev) =>
          prev.map((s) =>
            s.Id === sugestaoAtiva.Id
              ? { ...s, TotalMensagens: (s.TotalMensagens || 0) + 1 }
              : s,
          ),
        );
        setSugestaoAtiva((prev) =>
          prev
            ? { ...prev, TotalMensagens: (prev.TotalMensagens || 0) + 1 }
            : prev,
        );
      } else {
        await addSugestao(textoLimpo);
        setTexto("");

        if (!isAdmin) {
          mostrarSucesso();
        }

        await carregarSugestoes();

        if (listaRef.current) {
          listaRef.current.scrollTop = 0;
        }
      }
    } catch (error) {
      setErro(
        error.message ||
          (vista === "chat"
            ? "Não foi possível enviar a mensagem."
            : "Não foi possível publicar a sugestão."),
      );
    } finally {
      setAEnviar(false);
    }
  };

  const handleAprovar = async (id, event) => {
    event.stopPropagation();
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

  const executarEliminar = async (id) => {
    if (aModerar) return;

    setAModerar(id);
    setErro("");

    try {
      await eliminarSugestao(id);

      if (sugestaoAtiva?.Id === id) {
        voltarLista();
      } else {
        setSugestoes((prev) => prev.filter((s) => s.Id !== id));
      }
    } catch (error) {
      setErro(error.message || "Não foi possível eliminar a sugestão.");
    } finally {
      setAModerar(null);
    }
  };

  const handleEliminar = (id, event) => {
    event.stopPropagation();
    if (aModerar) return;

    showModal({
      type: "confirm",
      title: "Eliminar sugestão",
      message:
        "Tens a certeza que queres eliminar esta sugestão? Esta ação é irreversível e remove também o debate associado.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => executarEliminar(id),
    });
  };

  const handleVoto = async (id, tipo, event) => {
    event.stopPropagation();
    if (aVotar === id) return;

    setAVotar(id);
    setErro("");

    try {
      const resultado = await votarSugestao(id, tipo);

      const atualizar = (s) =>
        s.Id === id
          ? {
              ...s,
              Concordo: resultado.Concordo,
              NaoConcordo: resultado.NaoConcordo,
              MeuVoto: resultado.MeuVoto,
            }
          : s;

      setSugestoes((prev) => prev.map(atualizar));

      if (sugestaoAtiva?.Id === id) {
        setSugestaoAtiva((prev) => (prev ? atualizar(prev) : prev));
      }
    } catch (error) {
      setErro(error.message || "Não foi possível registar o voto.");
    } finally {
      setAVotar(null);
    }
  };

  const renderVotos = (s, pararPropagacao = false) => (
    <div
      className="forum-sugestao-votos"
      onClick={pararPropagacao ? (e) => e.stopPropagation() : undefined}
      onKeyDown={pararPropagacao ? (e) => e.stopPropagation() : undefined}
    >
      <button
        type="button"
        className={`forum-voto concordo${s.MeuVoto === "concordo" ? " ativo" : ""}`}
        onClick={(e) => handleVoto(s.Id, "concordo", e)}
        disabled={aVotar === s.Id}
      >
        Concordo ({s.Concordo ?? 0})
      </button>

      <button
        type="button"
        className={`forum-voto nao-concordo${s.MeuVoto === "nao_concordo" ? " ativo" : ""}`}
        onClick={(e) => handleVoto(s.Id, "nao_concordo", e)}
        disabled={aVotar === s.Id}
      >
        Não concordo ({s.NaoConcordo ?? 0})
      </button>
    </div>
  );

  return (
    <>
      {aberto && (
        <div
          className="forum-panel"
          role="dialog"
          aria-label="Fórum de Sugestões"
        >
          <div className="forum-panel-header">
            {vista === "chat" ? (
              <>
                <button
                  type="button"
                  className="forum-btn-voltar"
                  onClick={voltarLista}
                  aria-label="Voltar à lista"
                >
                  ←
                </button>
                <div className="forum-chat-header-info">
                  <h3>Debate</h3>
                  <span className="forum-panel-identidade">
                    {sugestaoAtiva?.TotalMensagens ?? 0} mensagem
                    {(sugestaoAtiva?.TotalMensagens ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            ) : (
              <div>
                <h3>Fórum de Sugestões</h3>
                {isAdmin ? (
                  <span className="forum-panel-identidade">
                    Painel de moderação
                  </span>
                ) : (
                  meuNumero && (
                    <span className="forum-panel-identidade">
                      Tu és o Utilizador #{meuNumero}
                    </span>
                  )
                )}
              </div>
            )}
            <button
              type="button"
              className="forum-panel-fechar"
              onClick={handleFecharPainel}
              aria-label="Fechar fórum"
            >
              ×
            </button>
          </div>

          {vista === "lista" ? (
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
                    className={`forum-sugestao${s.Minha ? " minha" : ""}${!s.Aprovada ? " pendente" : ""}${s.Aprovada ? " clicavel" : ""}`}
                    onClick={() => abrirChat(s)}
                    onKeyDown={(e) => {
                      if (s.Aprovada && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        abrirChat(s);
                      }
                    }}
                    role={s.Aprovada ? "button" : undefined}
                    tabIndex={s.Aprovada ? 0 : undefined}
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
                        <span className="forum-sugestao-badge pendente">
                          Pendente
                        </span>
                      )}
                      <span className="forum-sugestao-data">
                        {formatarDataRelativa(s.DataCriacao)}
                      </span>
                    </div>

                    <p className="forum-sugestao-texto">{s.Texto}</p>

                    {s.Aprovada && renderVotos(s, true)}

                    {s.Aprovada && (s.TotalMensagens ?? 0) > 0 && (
                      <span className="forum-sugestao-debate">
                        {s.TotalMensagens} mensagem
                        {s.TotalMensagens === 1 ? "" : "s"} no debate →
                      </span>
                    )}

                    {s.Aprovada && !(s.TotalMensagens ?? 0) && (
                      <span className="forum-sugestao-debate vazio">
                        Abrir debate →
                      </span>
                    )}

                    {isAdmin && (
                      <div
                        className="forum-moderacao"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!s.Aprovada && (
                          <button
                            type="button"
                            className="forum-btn-aprovar"
                            onClick={(e) => handleAprovar(s.Id, e)}
                            disabled={aModerar === s.Id}
                          >
                            Aprovar
                          </button>
                        )}
                        <button
                          type="button"
                          className="forum-btn-eliminar"
                          onClick={(e) => handleEliminar(s.Id, e)}
                          disabled={aModerar === s.Id}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </article>
                ))}
            </div>
          ) : (
            <div className="forum-chat" ref={chatRef}>
              {sugestaoAtiva && (
                <div className="forum-chat-contexto">
                  <div className="forum-sugestao-cabecalho">
                    <span
                      className={`forum-sugestao-autor${sugestaoAtiva.Utilizador === "Admin" ? " admin" : ""}`}
                    >
                      {obterAutor(sugestaoAtiva)}
                    </span>
                    <span className="forum-sugestao-data">
                      {formatarDataRelativa(sugestaoAtiva.DataCriacao)}
                    </span>
                  </div>
                  <p className="forum-sugestao-texto">{sugestaoAtiva.Texto}</p>
                  {renderVotos(sugestaoAtiva, true)}
                </div>
              )}

              {aCarregarMensagens && (
                <p className="forum-panel-estado">A carregar mensagens...</p>
              )}

              {!aCarregarMensagens && mensagens.length === 0 && (
                <div className="forum-chat-vazio">
                  <p>Ainda não há mensagens neste debate.</p>
                  <span>
                    Partilha a tua opinião, experiência ou sugestão de melhoria
                    para esta ideia.
                  </span>
                </div>
              )}

              {!aCarregarMensagens &&
                mensagens.map((m) => (
                  <div
                    key={m.Id}
                    className={`forum-chat-mensagem${m.Minha ? " minha" : ""}`}
                  >
                    <div className="forum-chat-mensagem-cabecalho">
                      <span
                        className={`forum-sugestao-autor${m.Utilizador === "Admin" ? " admin" : ""}`}
                      >
                        {obterAutor(m)}
                      </span>
                      <span className="forum-sugestao-data">
                        {formatarDataRelativa(m.DataCriacao)}
                      </span>
                    </div>
                    <p>{m.Texto}</p>
                  </div>
                ))}
            </div>
          )}

          {erro && <p className="forum-panel-erro">{erro}</p>}

          <div className="forum-panel-rodape-area">
            {vista === "lista" && sucessoMsg && (
              <p className="forum-panel-sucesso">{sucessoMsg}</p>
            )}

            <form className="forum-panel-rodape" onSubmit={handleEnviar}>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={
                  vista === "chat"
                    ? "Escreve uma mensagem..."
                    : "Partilha a tua sugestão..."
                }
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
