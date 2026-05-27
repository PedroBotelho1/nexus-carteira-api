# Nexus Crypto Wallet API

A **Nexus Crypto Wallet API** é uma aplicação Backend desenvolvida para o desafio prático da Nexus Soluções Financeiras. O sistema simula uma carteira de criptomoedas, permitindo gerenciar saldos, efetuar depósitos via webhooks e realizar operações de *swap* utilizando cotações reais do mercado.

O projeto consiste em uma API REST robusta, com arquitetura modular e cache de alto desempenho em nuvem.

## 🚀 Tecnologias Utilizadas

* **Node.js** & **TypeScript**
* **NestJS** (Framework modular e escalável)
* **PostgreSQL** (Banco de dados relacional)
* **Prisma ORM** (Modelagem e persistência de dados)
* **Redis / Upstash** (Cache Serverless para otimização de requisições)
* **JWT** (Autenticação e segurança)

---

## ⚙️ Funcionalidades

O sistema atende a todos os requisitos do desafio, incluindo alguns bônus:
* **Autenticação:** Cadastro de usuários e login com geração de JWT.
* **Carteira e Saldos:** Criação automática de carteira e consulta de saldos (BRL, BTC, ETH, USDT).
* **Depósito via Webhook:** Endpoint seguro para simular depósitos com validação de idempotência.
* **Swap (Conversão):** Cotação em tempo real através da API da CoinGecko e conversão com taxa fixa (1,5%).
* **Saque:** Simulação de retirada de fundos com validação de saldo.
* **Ledger (Extrato):** Registro imutável de todas as transações, garantindo rastreabilidade total (Auditoria).
* **Cache Inteligente (Bônus):** Utilização de Redis para armazenar cotações, evitando sobrecarga na API externa e entregando respostas em milissegundos.

---

## 🛠️ Decisões Técnicas & Estrutura do Banco

* **Por que NestJS?** Escolhido pela sua arquitetura modular, que facilita a separação de responsabilidades (Controllers, Services e Modules) e injeção de dependências nativa.
* **Modelagem do Banco de Dados:** O PostgreSQL foi estruturado com as tabelas `User`, `Wallet`, `Balance` e `Transaction`. A tabela de `Transaction` atua como o Ledger exigido, gravando o tipo de operação, saldo anterior e saldo novo, tornando toda a movimentação auditável.
* **Infraestrutura e Deploy:** A API foi preparada e hospedada na **Vercel** para facilitar a avaliação. Além disso, a implementação do **Redis (Upstash)** em nuvem garante que o avaliador possa testar a performance do cache sem precisar instalar e configurar motores locais em sua própria máquina.

---

## 💻 Como Executar o Projeto Localmente

Para rodar o projeto, abra o seu terminal e execute os comandos abaixo em sequência. Lembre-se de configurar o arquivo `.env` antes de rodar as migrações:

```bash
# 1. Clone o repositório e entre na pasta
git clone [https://github.com/PedroBotelho1/nexus-carteira-api](https://github.com/PedroBotelho1/nexus-carteira-api)
cd carteira-api

# 2. Instale as dependências
npm install

# 3. Crie o arquivo .env na raiz do projeto com as suas variáveis:
# DATABASE_URL="sua_url_do_postgres"
# REDIS_URL="sua_url_do_upstash"
# JWT_SECRET="sua_chave_secreta"

# 4. Execute as migrações do Prisma para criar as tabelas
npx prisma migrate dev

# 5. Inicie o servidor em modo de desenvolvimento
npm run start:dev


## 🧪 Guia de Testes da API

Incluí uma **Collection do Postman** na raiz deste projeto. Ela já contém todos os endpoints configurados com os exemplos de *payload* necessários.

### Como utilizar:

1. **Importação**: Baixe o arquivo `Nexus Crypto Wallet.postman_collection.json` presente na raiz deste repositório.
2. **Postman**: Abra o Postman, clique no botão **Import** e selecione o arquivo.
3. **Autenticação**: 
    * Para acessar as rotas protegidas, primeiro execute a requisição `[POST] Register User e depois a Login User.`
    * As rotas protegidas (ex: `/wallet`, `/swap`, `/withdraw`, `/transactions`) utilizam autenticação **Bearer Token**. Após o login, copie o `accessToken` retornado na resposta e cole-o na aba **Authorization** dessas requisições (selecione o tipo "Bearer Token").

### Dica :
* **Depósito via Webhook**: O campo `idempotencyKey` é obrigatório para garantir a unicidade da transação. Você pode gerar qualquer string única para testar.
* **Histórico de Transações**: A rota já está configurada com os parâmetros de paginação `page=1` e `limit=10`.