CREATE DATABASE jjgarage;
USE jjgarage;

-- 2. Tabela: Oficina (Limpa, delegando os tokens para a tabela própria)
CREATE TABLE Oficina (
    OficinaId INT AUTO_INCREMENT PRIMARY KEY,
    NomeOficina VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Status TINYINT DEFAULT 0,     -- 1 = Ativo, 0 = Inativo/Suspenso
    EmailWhop VARCHAR(100) NULL,   -- Adicionado para mapear o cliente ao Whop
    DataRegisto DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela: PasswordReset (Nova sugestão do Cursor)
CREATE TABLE IF NOT EXISTS `PasswordReset` (
    `ResetId` INT AUTO_INCREMENT PRIMARY KEY,
    `OficinaId` INT NOT NULL UNIQUE,
    `TokenHash` VARCHAR(255) NOT NULL UNIQUE,
    `ExpiresAt` DATETIME NOT NULL,
    `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`OficinaId`) REFERENCES `Oficina`(`OficinaId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela: Cliente
CREATE TABLE Cliente (
    ClienteId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
    Nome VARCHAR(100) NOT NULL,
    Contacto VARCHAR(20),
    Morada VARCHAR(100),
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE
);

-- 5. Tabela: Carro
CREATE TABLE Carro (
    CarroId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
    ClienteId INT NULL,
    MatriculaId VARCHAR(20) NOT NULL,
    Marca VARCHAR(20),
    Modelo VARCHAR(50),
    Ano INT,
    Vin VARCHAR(20),
    Cor VARCHAR(20),
    Motor VARCHAR(100),
    ImagemUrl VARCHAR(255),
    Segmento VARCHAR(20),
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE,
    FOREIGN KEY (ClienteId) REFERENCES Cliente(ClienteId) ON DELETE SET NULL
);

-- 6. Tabela: Servico
CREATE TABLE Servico (
    ServicoId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
    CarroId INT NOT NULL,
    TipoServico VARCHAR(50),
    DataServico DATE,
    DataConclusao DATETIME NULL,
    Kilometros VARCHAR(15),
    Status VARCHAR(30),
    PrecoFinal VARCHAR(15),
    MaoDeObra DECIMAL(10,2) DEFAULT 0.00,
    Observacao TEXT,
    Artigos TEXT,
    Anexos JSON NULL,
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE,
    FOREIGN KEY (CarroId) REFERENCES Carro(CarroId) ON DELETE CASCADE
);

-- 7. Tabela: CodigoConvite
CREATE TABLE CodigoConvite (
    CodigoId INT AUTO_INCREMENT PRIMARY KEY,
    Codigo VARCHAR(50) UNIQUE NOT NULL,
    Usado BOOLEAN DEFAULT FALSE,
    EmailWhop VARCHAR(100) NULL,
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Fórum de Sugestões
CREATE TABLE ForumAnonimo (
    OficinaId INT NOT NULL PRIMARY KEY,
    NumeroAnonimo INT NOT NULL UNIQUE,
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE
);

CREATE TABLE Sugestao (
    SugestaoId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
    Texto TEXT NOT NULL,
    Aprovada TINYINT DEFAULT 0 NOT NULL,
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE
);

CREATE TABLE SugestaoVoto (
    VotoId INT AUTO_INCREMENT PRIMARY KEY,
    SugestaoId INT NOT NULL,
    OficinaId INT NOT NULL,
    Tipo ENUM('like', 'dislike') NOT NULL,
    UNIQUE KEY uk_sugestao_oficina (SugestaoId, OficinaId),
    FOREIGN KEY (SugestaoId) REFERENCES Sugestao(SugestaoId) ON DELETE CASCADE,
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE
);

CREATE TABLE SugestaoMensagem (
    MensagemId INT AUTO_INCREMENT PRIMARY KEY,
    SugestaoId INT NOT NULL,
    OficinaId INT NOT NULL,
    Texto TEXT NOT NULL,
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SugestaoId) REFERENCES Sugestao(SugestaoId) ON DELETE CASCADE,
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE
);

-- ================================================
-- 9. Criação de Índices para Performance (Sugestão do Cursor)
-- ================================================
CREATE INDEX idx_emailwhop_oficina ON Oficina(EmailWhop);
CREATE INDEX idx_status_oficina ON Oficina(Status);
CREATE INDEX idx_emailwhop_codigo ON CodigoConvite(EmailWhop);

INSERT INTO `CodigoConvite` (`Codigo`, `Usado`, `EmailWhop`) VALUES
('JJG-7X2A-9B1C', 0, NULL), ('JJG-4M9K-2P5V', 0, NULL), ('JJG-8R3W-7Q1X', 0, NULL), ('JJG-5B2Z-6Y9V', 0, NULL), ('JJG-1N8M-3K4P', 0, NULL),
('JJG-9V6C-4X2Z', 0, NULL), ('JJG-3P1W-8R7K', 0, NULL), ('JJG-6Q5M-9N2B', 0, NULL), ('JJG-2Z7Y-4V3X', 0, NULL), ('JJG-5K1P-8M9R', 0, NULL),
('JJG-8B4V-2Z6Q', 0, NULL), ('JJG-3X9W-7N1M', 0, NULL), ('JJG-6K2P-5R8V', 0, NULL), ('JJG-9Y7Z-4X1B', 0, NULL), ('JJG-2M5N-8Q3K', 0, NULL),
('JJG-7V1X-9W4P', 0, NULL), ('JJG-4B6Z-3Y8M', 0, NULL), ('JJG-8K9R-2P5Q', 0, NULL), ('JJG-5N1M-7V3X', 0, NULL), ('JJG-3W8K-6Y2Z', 0, NULL),
('JJG-9M4P-1V7X', 0, NULL), ('JJG-6R2K-8B5Q', 0, NULL), ('JJG-2Y7Z-3X9W', 0, NULL), ('JJG-5N4M-6V1P', 0, NULL), ('JJG-8K3R-7Y9Z', 0, NULL),
('JJG-4W2X-8M5P', 0, NULL), ('JJG-1V7K-9Q3B', 0, NULL), ('JJG-6Z2Y-4N8M', 0, NULL), ('JJG-3P5R-7X1W', 0, NULL), ('JJG-9B6Q-2K4V', 0, NULL),
('JJG-5M1N-8Z7Y', 0, NULL), ('JJG-2X4W-9K3P', 0, NULL), ('JJG-7R8V-5M1Q', 0, NULL), ('JJG-3Z6Y-2N4B', 0, NULL), ('JJG-8W1X-9P7K', 0, NULL),
('JJG-4M5V-6Q2Z', 0, NULL), ('JJG-1K9R-3Y7B', 0, NULL), ('JJG-7N4M-8V2P', 0, NULL), ('JJG-5X1W-6Z3Y', 0, NULL), ('JJG-2Q8K-9M4P', 0, NULL),
('JJG-8V3Z-7N1M', 0, NULL), ('JJG-3Y6W-5P2R', 0, NULL), ('JJG-9K4Q-1B7V', 0, NULL), ('JJG-6M2N-8X4Z', 0, NULL), ('JJG-4P1K-7R9W', 0, NULL),
('JJG-2Z5Y-3V8M', 0, NULL), ('JJG-7X1W-9N4Q', 0, NULL), ('JJG-5M3K-6R2P', 0, NULL), ('JJG-1B8V-4Z7Y', 0, NULL), ('JJG-9P2W-3M6X', 0, NULL);