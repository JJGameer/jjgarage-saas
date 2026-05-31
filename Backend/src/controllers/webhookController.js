const db = require("../config/db.js");
const {
  sendEmail,
  emailCodigoConvite,
  emailBemVindoDeVolta,
  emailSuspensao,
} = require("../services/emailService.js");

const handleWhopWebhook = async (req, res) => {
  const { event, data } = req.body;

  try {
    // Validação de segurança: verificar se o webhook vem do Whop
    // TODO: Adicionar verificação de assinatura (signature verification)
    if (!process.env.WHOP_WEBHOOK_SECRET) {
      console.warn(
        "⚠️ WHOP_WEBHOOK_SECRET não configurado - webhooks não validados",
      );
    }

    console.log(`📩 Webhook Whop recebido: ${event}`);

    const emailWhop = data?.email;
    if (!emailWhop) {
      return res.status(400).json({ error: "Email não fornecido no webhook" });
    }

    switch (event) {
      case "membership_activated":
        await handleMembershipActivation(emailWhop, data);
        break;

      case "membership_deactivated":
        await handleMembershipCancellation(emailWhop);
        break;

      default:
        console.log(`⚠️ Evento não tratado: ${event}`);
    }

    res.status(200).json({ success: true, message: `Evento ${event} processado` });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
};

const handleMembershipActivation = async (emailWhop, data) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Procura se já existe cliente com este EmailWhop
    const [existingOficinas] = await connection.query(
      "SELECT OficinaId, NomeOficina FROM Oficina WHERE EmailWhop = ? FOR UPDATE",
      [emailWhop],
    );

    if (existingOficinas.length > 0) {
      // Cliente já existe - reativação
      const oficina = existingOficinas[0];
      await connection.query(
        "UPDATE Oficina SET Status = 1 WHERE EmailWhop = ?",
        [emailWhop],
      );

      await connection.commit();

      // Enviar email de bem-vindo de volta
      try {
        const html = emailBemVindoDeVolta(oficina.NomeOficina);
        await sendEmail(emailWhop, "Bem-vindo de Volta ao JJGarage!", html);
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de reativação:", emailError);
      }

      console.log(
        `✅ Oficina reativada: ${oficina.NomeOficina} (${emailWhop})`,
      );
    } else {
      // Cliente novo - apanhar código disponível
      const [codigoRow] = await connection.query(
        "SELECT CodigoId, Codigo FROM CodigoConvite WHERE Usado = FALSE LIMIT 1 FOR UPDATE",
      );

      if (codigoRow.length === 0) {
        await connection.rollback();
        console.error(`❌ Sem códigos disponíveis para ${emailWhop}`);
        throw new Error("Nenhum código de convite disponível");
      }

      const { CodigoId, Codigo } = codigoRow[0];

      // Atualizar código como usado e guardar EmailWhop
      await connection.query(
        "UPDATE CodigoConvite SET Usado = TRUE, EmailWhop = ? WHERE CodigoId = ?",
        [emailWhop, CodigoId],
      );

      await connection.commit();

      // Enviar email com código
      try {
        const urlRegistro = `${process.env.FRONTEND_URL || "https://jjgarage.pt"}/registro?codigo=${Codigo}`;
        const html = emailCodigoConvite(Codigo, urlRegistro);
        await sendEmail(
          emailWhop,
          "Seu Código de Acesso JJGarage",
          html,
        );
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de código:", emailError);
      }

      console.log(`✅ Novo cliente criado: ${emailWhop} com código ${Codigo}`);
    }
  } catch (error) {
    await connection.rollback();
    console.error("❌ Erro na ativação de membro:", error);
    throw error;
  } finally {
    connection.release();
  }
};

const handleMembershipCancellation = async (emailWhop) => {
  try {
    // Procura oficina e suspende
    const [oficinas] = await db
      .promise()
      .query("SELECT NomeOficina FROM Oficina WHERE EmailWhop = ?", [
        emailWhop,
      ]);

    if (oficinas.length > 0) {
      await db
        .promise()
        .query("UPDATE Oficina SET Status = 0 WHERE EmailWhop = ?", [
          emailWhop,
        ]);

      // Enviar email de suspensão
      try {
        const html = emailSuspensao(oficinas[0].NomeOficina);
        await sendEmail(
          emailWhop,
          "Sua Subscrição JJGarage foi Suspensa",
          html,
        );
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de suspensão:", emailError);
      }

      console.log(`⏸️ Oficina suspensa: ${oficinas[0].NomeOficina} (${emailWhop})`);
    }
  } catch (error) {
    console.error("❌ Erro ao cancelar membro:", error);
    throw error;
  }
};

module.exports = { handleWhopWebhook };
