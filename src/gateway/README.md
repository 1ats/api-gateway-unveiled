# API Gateway Customizado

Gateway centralizado para gerenciar seus 40+ microsserviços Node.js/Express com autenticação, rate limiting, logs e health checks.

## 🚀 Características

- **Roteamento Dinâmico**: Configura automaticamente rotas para todos os microsserviços
- **Autenticação Centralizada**: JWT validation com integração ao serviço de auth
- **Rate Limiting**: Proteção contra spam e ataques DDoS
- **Health Checks**: Monitoramento de saúde de todos os serviços
- **Logging Estruturado**: Logs JSON para análise e debugging
- **Docker Ready**: Pronto para deploy no Azure via Docker
- **TypeScript**: Type safety completo
- **CORS Configurável**: Suporte para múltiplos fronts Next.js

## 📁 Estrutura

```
src/gateway/
├── server.ts              # Servidor principal
├── config/
│   └── services.ts        # Configuração dos microsserviços
├── middleware/
│   ├── auth.ts            # Autenticação JWT
│   ├── logging.ts         # Sistema de logs
│   └── error.ts           # Tratamento de erros
├── routes/
│   └── health.ts          # Health checks
├── Dockerfile             # Container Docker
├── docker-compose.yml     # Orquestração local
└── package.json           # Dependências
```

## ⚙️ Configuração

### 1. Configure seus microsserviços

Edite `config/services.ts` e adicione todos os seus 40+ serviços:

```typescript
export const serviceRegistry = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    basePath: '/auth',
    requireAuth: false
  },
  users: {
    url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
    basePath: '/api',
    requireAuth: true
  },
  // Adicione seus outros serviços aqui...
};
```

### 2. Configure variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 3. Instale dependências

```bash
cd src/gateway
npm install
```

### 4. Execute em desenvolvimento

```bash
npm run dev
```

## 🐳 Deploy com Docker

### Build da imagem

```bash
docker build -t api-gateway .
```

### Execute com Docker Compose

```bash
docker-compose up -d
```

### Deploy no Azure

1. Push da imagem para Azure Container Registry
2. Configure as variáveis de ambiente no Azure
3. Deploy via Azure Container Instances ou App Service

## 📋 Uso

### Roteamento

Todas as requisições seguem o padrão:
```
https://seu-gateway.com/api/{service-name}/{endpoint}
```

Exemplos:
- `GET /api/users/profile` → redireciona para `USERS_SERVICE_URL/api/profile`
- `POST /api/orders/create` → redireciona para `ORDERS_SERVICE_URL/api/create`
- `GET /api/products/list` → redireciona para `PRODUCTS_SERVICE_URL/api/list`

### Autenticação

Inclua o token JWT no header:
```
Authorization: Bearer {seu-jwt-token}
```

### Health Checks

- `GET /health` - Status básico do gateway
- `GET /health/detailed` - Status de todos os microsserviços
- `GET /health/service/{service-name}` - Status de um serviço específico

## 🔧 Configuração para seus fronts Next.js

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📊 Monitoramento

Os logs são estruturados em JSON e incluem:
- Timestamp
- Método HTTP
- URL
- User ID
- Tempo de resposta
- Status code
- Serviço de destino

Exemplo de log:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "GET",
  "url": "/api/users/profile",
  "userId": "user123",
  "responseTime": 150,
  "statusCode": 200,
  "service": "users"
}
```

## 🔐 Segurança

- **Rate Limiting**: 100 req/15min por IP
- **CORS**: Configurável por domínio
- **Helmet**: Headers de segurança
- **JWT Validation**: Autenticação centralizada
- **Error Handling**: Não expõe informações sensíveis

## 🚀 Próximos Passos

1. Configure todos os seus microsserviços no `services.ts`
2. Ajuste as URLs de produção no `.env`
3. Configure os fronts Next.js para usar o gateway
4. Deploy no Azure via Docker
5. Configure monitoramento e alertas

Agora seus 40+ microsserviços têm um ponto de entrada unificado! 🎉