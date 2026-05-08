CREATE DATABASE Oficina;
USE Oficina;

DROP DATABASE Oficina;

CREATE TABLE Oficina(
	OficinaId INT AUTO_INCREMENT PRIMARY KEY,
    NomeOficina VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    DataRegisto DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Cliente(
	ClienteId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
	Nome VARCHAR(100),
    Contacto VARCHAR(20),
    Morada VARCHAR(100),
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE
);

CREATE TABLE Carro(
	CarroId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
    ClienteId INT,
	MatriculaId VARCHAR(20) NOT NULL,
    Marca VARCHAR(20),
    Modelo VARCHAR(50),
    Ano INT,
    VIN VARCHAR(20),
    Cor VARCHAR(20),
    Motor VARCHAR(30),
    ImagemUrl VARCHAR(255),
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE,
    FOREIGN KEY (ClienteId) REFERENCES Cliente(ClienteId) ON DELETE SET NULL
);

CREATE TABLE Servico(
	ServicoId INT AUTO_INCREMENT PRIMARY KEY,
    OficinaId INT NOT NULL,
    CarroId INT NOT NULL,
    TipoServico VARCHAR(50),
	DataServico DATE,
    DataConclusao DATETIME NULL,
    Kilometros VARCHAR(15),
    Status VARCHAR(30),
    PrecoFinal VARCHAR(15),
    Observacao TEXT,
    Artigos TEXT,
    FOREIGN KEY (OficinaId) REFERENCES Oficina(OficinaId) ON DELETE CASCADE,
    FOREIGN KEY (CarroId) REFERENCES Carro(CarroId) ON DELETE CASCADE
);

CREATE TABLE CodigoConvite (
    CodigoId INT AUTO_INCREMENT PRIMARY KEY,
    Codigo VARCHAR(50) UNIQUE NOT NULL,
    Usado BOOLEAN DEFAULT FALSE,
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE Servico ADD COLUMN Anexos JSON NULL;
INSERT INTO CodigoConvite (Codigo) VALUES ('CLIENTEJOAO-1');
INSERT INTO CodigoConvite (Codigo) VALUES ('CLIENTEJOAO-2');

INSERT INTO Cliente (Nome, Contacto, Morada) VALUES 
('João Silva', '912345678', 'Rua das Flores, nº 10, Lisboa'),
('Maria Santos', '961234567', 'Avenida da Liberdade, nº 50, Porto');

