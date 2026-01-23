# 🔧 Solução do Erro "Property 'require' doesn't exist"

## ✅ Correções Aplicadas

1. **Instalado `expo-constants`** - Para acessar variáveis de ambiente corretamente no Expo
2. **Atualizado `polyfills.js`** - Melhor suporte para `require` e `process`
3. **Configurado `app.json`** - Variáveis de ambiente agora estão no `extra`
4. **Atualizado `config.ts`** - Usa `Constants.expoConfig.extra` ao invés de `process.env`

## 🚀 Próximos Passos

1. **Pare o servidor Expo** (Ctrl+C)

2. **Limpe o cache completamente:**
```bash
npx expo start --clear
```

3. **Se ainda der erro, tente:**
```bash
# Limpar tudo
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

4. **No Expo Go, force o reload:**
   - Agite o celular
   - Toque em "Reload"
   - Ou pressione `r` no terminal

## 📝 Nota sobre Variáveis de Ambiente

No Expo, variáveis de ambiente devem ser configuradas no `app.json` na seção `extra`:

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://localhost:3000/api",
      "MONGODB_URI": "...",
      "EXPO_PROJECT_ID": "..."
    }
  }
}
```

**Para testar no celular físico**, você precisa atualizar o `API_BASE_URL` no `app.json` para o IP da sua máquina:

```json
"API_BASE_URL": "http://192.168.1.XXX:3000/api"
```

## ⚠️ Se o Erro Persistir

O erro pode estar vindo de alguma biblioteca específica. Tente:

1. Verificar o console do Expo Go para mais detalhes do erro
2. Verificar se todas as dependências estão instaladas: `npm install`
3. Verificar se há conflitos de versão
