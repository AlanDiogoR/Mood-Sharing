# Mood Sharing App

Um aplicativo React Native que permite que casais compartilhem seus estados emocionais em tempo real. O app exibe o estado emocional do parceiro na tela de bloqueio e atualiza automaticamente para "feliz" quando os dois estão próximos (menos de 1km de distância).

## 🚀 Funcionalidades

- **Autenticação**: Login e registro com JWT
- **Tela de Bloqueio Customizada**: Exibe o estado emocional do parceiro com animações suaves
- **Estados Emocionais**: 8 tipos diferentes de estados (feliz, triste, ansioso, calmo, empolgado, cansado, irritado, apaixonado)
- **Geolocalização em Background**: Rastreamento contínuo da localização
- **Detecção de Proximidade**: Atualização automática para "feliz" quando a distância é menor que 1km
- **Notificações Push**: Notificações quando o parceiro muda de estado ou quando estão próximos
- **Biometria**: Desbloqueio com impressão digital ou Face ID
- **Animações Suaves**: Transições e animações fluidas em toda a aplicação

## 📋 Pré-requisitos

- Node.js >= 16
- React Native CLI ou Expo CLI
- Android Studio (para Android)
- Xcode (para iOS)
- MongoDB (para o backend)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/mood-sharing.git
cd mood-sharing
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```env
API_BASE_URL=https://sua-api-url.com/api
MONGODB_URI=sua-string-de-conexao-mongodb
```

4. Para iOS, instale os pods:
```bash
cd ios
pod install
cd ..
```

## 🏃 Executando o App

### Android
```bash
npm run android
# ou
yarn android
```

### iOS
```bash
npm run ios
# ou
yarn ios
```

## 📁 Estrutura do Projeto

```
mood-sharing-app/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── common/          # Botões, inputs, etc.
│   │   ├── lock-screen/    # Componentes da tela de bloqueio
│   │   └── mood-selector/  # Seletor de emoji/estado
│   ├── screens/            # Telas principais
│   │   ├── LoginScreen.tsx
│   │   ├── LockScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── navigation/         # Configuração de navegação
│   ├── services/           # Serviços e APIs
│   │   ├── authService.ts
│   │   ├── moodService.ts
│   │   ├── locationService.ts
│   │   └── notificationService.ts
│   ├── store/              # Gerenciamento de estado
│   │   ├── authContext.tsx
│   │   └── moodContext.tsx
│   ├── utils/              # Funções utilitárias
│   ├── types/              # TypeScript types/interfaces
│   ├── constants/          # Constantes do app
│   └── hooks/              # Custom hooks
├── android/                # Código nativo Android
├── ios/                    # Código nativo iOS
└── ...
```

## 🎨 Style Guide

O app utiliza um tema em azul escuro:

- **Cor Primária**: `#1a237e` (azul escuro)
- **Cor Secundária**: `#283593`
- **Background**: `#0d1117` (quase preto)
- **Texto**: `#ffffff` / `#e0e0e0`
- **Acentos**: `#3f51b5` / `#5c6bc0`

## 🔧 Configuração

### MongoDB

A string de conexão do MongoDB deve ser configurada na variável de ambiente `MONGODB_URI`. O backend deve usar esta conexão para armazenar:

- Usuários e autenticação
- Estados emocionais
- Localizações
- Relacionamentos entre parceiros

### Permissões

O app requer as seguintes permissões:

- **Localização**: Para rastreamento em background
- **Biometria**: Para desbloqueio seguro
- **Notificações**: Para notificações push

### Firebase (Notificações)

Para configurar notificações push:

1. Crie um projeto no Firebase Console
2. Adicione os arquivos de configuração:
   - `android/app/google-services.json` (Android)
   - `ios/GoogleService-Info.plist` (iOS)
3. Configure o Firebase Cloud Messaging no backend

## 📱 Uso

1. **Registro/Login**: Crie uma conta ou faça login
2. **Vincular Parceiro**: Durante o registro, você pode vincular o email do seu parceiro
3. **Atualizar Estado**: Selecione seu estado emocional atual na tela principal
4. **Visualizar Parceiro**: O estado do seu parceiro aparece na tela de bloqueio
5. **Proximidade**: Quando vocês estão próximos (< 1km), ambos são automaticamente atualizados para "feliz"

## 🧪 Testes

```bash
npm test
# ou
yarn test
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o Metro bundler
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas do linter
- `npm run format` - Formata o código com Prettier
- `npm run type-check` - Verifica tipos TypeScript

## 🔒 Segurança

- Tokens JWT armazenados de forma segura
- Senhas hasheadas no backend
- Biometria para desbloqueio
- Comunicação HTTPS com a API
- Validação de dados no cliente e servidor

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autor

- Alan Diogo - (https://github.com/alanDiogoR)

## 🙏 Agradecimentos

- React Native Community
- Todos os contribuidores de bibliotecas open source utilizadas

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email:alandiogor@gmail.com
