# Guia de Configuração

Este guia detalha os passos necessários para configurar e executar o Mood Sharing App.

## Pré-requisitos

### Instalação Global

1. **Node.js** (versão 16 ou superior)
   ```bash
   node --version
   ```

2. **npm** ou **yarn**
   ```bash
   npm --version
   # ou
   yarn --version
   ```

3. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

### Android

1. **Android Studio** - Instale o Android Studio
2. **Android SDK** - Configure o SDK através do Android Studio
3. **Variáveis de Ambiente:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### iOS (apenas macOS)

1. **Xcode** - Instale via App Store
2. **CocoaPods:**
   ```bash
   sudo gem install cocoapods
   ```

## Configuração do Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/mood-sharing-app.git
   cd mood-sharing-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e configure:
   - `API_BASE_URL`: URL da sua API backend
   - `MONGODB_URI`: String de conexão MongoDB (será usado pelo backend)

4. **Para iOS, instale os pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Executando o App

### Android

1. **Inicie o Metro Bundler:**
   ```bash
   npm start
   ```

2. **Em outro terminal, execute:**
   ```bash
   npm run android
   ```

   Ou execute diretamente:
   ```bash
   npm run android
   ```

### iOS

1. **Inicie o Metro Bundler:**
   ```bash
   npm start
   ```

2. **Em outro terminal, execute:**
   ```bash
   npm run ios
   ```

## Configuração Adicional

### Firebase (Notificações Push)

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)

2. **Android:**
   - Baixe `google-services.json`
   - Coloque em `android/app/google-services.json`
   - Adicione ao `android/build.gradle`:
     ```gradle
     dependencies {
         classpath 'com.google.gms:google-services:4.3.15'
     }
     ```
   - Adicione ao `android/app/build.gradle`:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```

3. **iOS:**
   - Baixe `GoogleService-Info.plist`
   - Adicione ao projeto Xcode
   - Configure no `ios/Podfile` se necessário

### Permissões

O app requer as seguintes permissões:

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

**iOS** (`ios/YourApp/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Precisamos da sua localização para mostrar quando você está próximo do seu parceiro</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Precisamos da sua localização em background para detectar proximidade</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Precisamos da sua localização em background para detectar proximidade</string>
```

## Troubleshooting

### Erro: "Unable to resolve module"

```bash
npm start -- --reset-cache
```

### Erro no Android: "SDK location not found"

Configure a variável `ANDROID_HOME` no seu ambiente.

### Erro no iOS: "Pod install failed"

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Erro: "Metro bundler failed"

```bash
watchman watch-del-all
rm -rf node_modules
npm install
npm start -- --reset-cache
```

## Desenvolvimento

### Estrutura de Pastas

```
src/
├── components/     # Componentes reutilizáveis
├── screens/        # Telas do app
├── services/       # Serviços de API
├── store/          # Context API (estado global)
├── utils/          # Funções utilitárias
├── types/          # TypeScript types
├── constants/      # Constantes e configurações
└── hooks/          # Custom hooks
```

### Comandos Úteis

```bash
# Verificar tipos TypeScript
npm run type-check

# Executar linter
npm run lint

# Corrigir problemas do linter
npm run lint:fix

# Formatar código
npm run format

# Executar testes
npm test
```

## Próximos Passos

1. Configure o backend seguindo `API_EXAMPLES.md`
2. Configure Firebase para notificações push
3. Teste todas as funcionalidades
4. Configure CI/CD se necessário

## Suporte

Se encontrar problemas, abra uma issue no GitHub ou consulte a documentação do React Native.
