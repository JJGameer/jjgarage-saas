-- Adiciona a coluna MaoDeObra à tabela Servico
ALTER TABLE Servico
  ADD COLUMN MaoDeObra DECIMAL(10,2) NOT NULL DEFAULT 0.00;
