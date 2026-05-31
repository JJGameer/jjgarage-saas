-- ====== Alterações para suporte de Whop e recuperação de password ======

-- 1. Atualizar tabela CodigoConvite
-- ALTER TABLE `CodigoConvite`
-- ADD COLUMN `EmailWhop` varchar(100) DEFAULT NULL;

-- 2. Atualizar tabela Oficina
-- ALTER TABLE `Oficina`
-- ADD COLUMN `EmailWhop` varchar(100) DEFAULT NULL,
-- ADD COLUMN `Status` tinyint(1) DEFAULT 1;

-- 3. Criar tabela PasswordReset
CREATE TABLE IF NOT EXISTS `PasswordReset` (
  `ResetId` int AUTO_INCREMENT PRIMARY KEY,
  `OficinaId` int NOT NULL UNIQUE,
  `TokenHash` varchar(255) NOT NULL UNIQUE,
  `ExpiresAt` datetime NOT NULL,
  `CreatedAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`OficinaId`) REFERENCES `Oficina`(`OficinaId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Criar índices para melhor performance
CREATE INDEX idx_emailwhop_oficina ON Oficina(EmailWhop);
CREATE INDEX idx_status_oficina ON Oficina(Status);
CREATE INDEX idx_emailwhop_codigo ON CodigoConvite(EmailWhop);

-- ====== Verificação dos esquemas ======
-- Executar para confirmar que as colunas existem:
-- DESCRIBE CodigoConvite;
-- DESCRIBE Oficina;
-- DESCRIBE PasswordReset;
