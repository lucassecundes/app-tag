# Fluxo de Permissões e Serviços: Localização e Bluetooth (Android)

Este documento descreve o fluxo implementado no hook `useBluetoothTracker.ts` para garantir que o aplicativo possua as permissões e serviços necessários para rastrear Tags Bluetooth em segundo plano no Android (API 23+).

## 1. Objetivo
Garantir que o rastreamento via Bluetooth só seja iniciado quando:
- A permissão de Localização estiver concedida.
- O serviço de GPS estiver ativado.
- As permissões de Bluetooth estiverem concedidas (Android 12+ usa `BLUETOOTH_SCAN` e `BLUETOOTH_CONNECT`; Android 11 e inferiores usam `ACCESS_FINE_LOCATION`).
- O serviço/rádio do Bluetooth estiver ativado.

## 2. O Fluxo de Validação (`ensurePermissionsAndServices`)

A verificação ocorre na seguinte ordem de dependência:

1. **Permissão de Localização (Expo)**
   - O app verifica silenciosamente (`Location.getForegroundPermissionsAsync`).
   - Se não concedido, pede permissão ao usuário (`Location.requestForegroundPermissionsAsync`).
   - Se o usuário negar, exibe um alerta customizado (`showPermissionAlert`) com a opção de "Abrir Configurações". O fluxo é interrompido.

2. **Status do GPS**
   - O app verifica se o GPS está ligado (`Location.hasServicesEnabledAsync`).
   - Se desligado, exibe um alerta instruindo o usuário a ligá-lo. O fluxo é interrompido.

3. **Permissão de Bluetooth (Android)**
   - **API >= 31 (Android 12+)**: Checa e solicita `BLUETOOTH_SCAN` e `BLUETOOTH_CONNECT`.
   - **API < 31 (Android 11 ou menor)**: Checa e solicita `ACCESS_FINE_LOCATION` via API nativa do Android (já que o scan BLE em versões antigas dependia da localização).
   - Se negado permanentemente, exibe um alerta customizado direcionando às configurações. O fluxo é interrompido.

4. **Status do Bluetooth (Rádio)**
   - O app verifica o status real do Bluetooth usando a `react-native-ble-plx` (`manager.state()`).
   - Se estiver desligado (`PoweredOff`), aciona um popup do próprio sistema operacional sugerindo ativar o Bluetooth (`manager.enable()`).
   - Se o usuário recusar no popup, o fluxo é interrompido.

## 3. Controle de Frequência (Anti-Spam)

Para não prejudicar a experiência do usuário com popups repetitivos caso ele negue alguma permissão:
- O hook utiliza uma variável global (`hasRequestedPermissionsThisSession = true`) que registra se as permissões já foram pedidas na sessão atual.
- Se o fluxo for interrompido por recusa, a variável impede que novos diálogos sejam exibidos.
- **Exceção (Check Silencioso)**: Mesmo não exibindo popups, o app continuará executando `checkOnlyPermissions()` de fundo para tentar iniciar o scan caso o usuário tenha ido nas configurações e habilitado as opções manualmente.
- **Reset no App Open**: O listener do `AppState` reseta a variável `hasRequestedPermissionsThisSession` para `false` sempre que o app transita de `background` para `active` (foreground). Assim, o app pede novamente *apenas* quando o usuário o reabre, cumprindo o requisito de negócio.

## 4. Casos Limite (Edge Cases)

- **Permissão negada permanentemente (Don't ask again)**:
  Neste caso, a API nativa não exibe mais o diálogo. O nosso código detecta que o resultado foi `DENIED` ou `NEVER_ASK_AGAIN` e invoca a função `showPermissionAlert`, que cria um Alert amigável com um botão que leva o usuário direto para a tela de configurações do aplicativo (`Linking.openSettings()`).

- **Bluetooth ligado durante a execução do app**:
  Se o Bluetooth estava desligado e o usuário liga pelo atalho rápido do celular, ao voltar pro app (que dispara a transição de AppState para `active`), o fluxo detectará que os serviços estão ativos agora e iniciará o scan automaticamente.

- **Permissões em Aparelhos Antigos (Android 11 e inferiores)**:
  Em aparelhos mais antigos, ligar o Bluetooth não basta; o Scan não retorna resultados se o GPS também não estiver ligado e a permissão `ACCESS_FINE_LOCATION` não for concedida. O fluxo engloba todas essas travas para garantir a compatibilidade em qualquer versão do Android suportada pelo app.
