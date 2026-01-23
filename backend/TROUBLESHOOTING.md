# 🔧 Solução de Problemas - MongoDB

## Erro: "bad auth : Authentication failed"

Este erro geralmente ocorre por um dos seguintes motivos:

### 1. ✅ Verificar Credenciais

Certifique-se de que o usuário e senha estão corretos no arquivo `.env`:

```env
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.nvlz1pz.mongodb.net/mood_sharing_db?retryWrites=true&w=majority
```

**Importante:** Se a senha contém caracteres especiais (`@`, `:`, `/`, `#`, `?`, etc.), eles precisam ser codificados na URL:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `#` → `%23`
- `?` → `%3F`

### 2. ✅ Liberar IP no MongoDB Atlas

1. Acesse: https://cloud.mongodb.com
2. Faça login na sua conta
3. Selecione seu cluster
4. Vá em **"Network Access"** (ou "IP Access List")
5. Clique em **"Add IP Address"**
6. Escolha uma das opções:
   - **Para desenvolvimento:** Adicione `0.0.0.0/0` (permite todos os IPs - **use apenas em desenvolvimento**)
   - **Para produção:** Adicione seu IP específico
7. Clique em **"Confirm"**

### 3. ✅ Verificar Permissões do Usuário

1. No MongoDB Atlas, vá em **"Database Access"**
2. Verifique se o usuário `alandiogor_db_user` existe
3. Certifique-se de que ele tem permissões de **"Read and write to any database"** ou pelo menos no banco `mood_sharing_db`

### 4. ✅ Verificar String de Conexão

A string de conexão deve estar no formato:

```
mongodb+srv://usuario:senha@cluster.mongodb.net/nome_do_banco?retryWrites=true&w=majority
```

### 5. ✅ Testar Conexão

Execute o script de teste:

```bash
node test-connection.js
```

## 🔄 Alternativa: Criar Novo Usuário

Se o problema persistir, crie um novo usuário no MongoDB Atlas:

1. Vá em **"Database Access"**
2. Clique em **"Add New Database User"**
3. Escolha **"Password"** como método de autenticação
4. Crie um usuário e senha simples (sem caracteres especiais)
5. Dê permissão **"Atlas admin"** ou **"Read and write to any database"**
6. Atualize o arquivo `.env` com as novas credenciais

## 📝 Exemplo de String de Conexão Correta

```env
MONGODB_URI=mongodb+srv://meu_usuario:minha_senha123@cluster0.nvlz1pz.mongodb.net/mood_sharing_db?retryWrites=true&w=majority
```

## ⚠️ Importante

- Nunca compartilhe suas credenciais do MongoDB
- Use `0.0.0.0/0` apenas em desenvolvimento
- Em produção, restrinja o acesso por IP
- Use senhas fortes mas sem caracteres especiais problemáticos
