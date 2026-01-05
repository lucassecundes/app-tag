import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const PRIVACY_CONTENT = `BESAT RASTREAMENTO | TAGPRO+
POLÍTICAS E TERMOS LEGAIS

-------------------------------------------
1. TERMOS DE USO
-------------------------------------------

Bem-vindo ao site da BESAT RASTREAMENTO. Ao acessar ou utilizar este site, o CLIENTE concorda integralmente com os termos e condições a seguir.

1. OBJETO
O presente Termo regula o uso do site e dos serviços da BESAT, incluindo a comercialização do rastreador TAGPRO+ e o acesso à plataforma de rastreamento.

2. ACEITAÇÃO
Ao utilizar o site ou adquirir o produto, o CLIENTE declara ter lido e aceito integralmente os Termos de Uso e a Política de Privacidade.

3. CADASTRO
O CLIENTE deve fornecer informações verdadeiras, atualizadas e completas. O uso de dados falsos poderá resultar em cancelamento do cadastro.

4. FUNCIONALIDADE DO SITE
A BESAT se reserva o direito de modificar, suspender ou encerrar qualquer funcionalidade do site sem aviso prévio.

5. PROPRIEDADE INTELECTUAL
Todo o conteúdo do site é protegido por direitos autorais. É proibida a reprodução total ou parcial sem autorização da BESAT.

6. RESPONSABILIDADE DO USUÁRIO
O CLIENTE compromete-se a utilizar o site apenas para fins lícitos e a não tentar invadir, copiar ou danificar sistemas ou informações.

7. LIMITAÇÃO DE RESPONSABILIDADE
A BESAT não será responsável por falhas de acesso, vírus, mau uso do sistema ou interrupções temporárias de serviço.

8. ALTERAÇÕES
A BESAT pode atualizar estes Termos a qualquer momento, sendo responsabilidade do CLIENTE consultá-los periodicamente.

9. FORO
Fica eleito o foro da Comarca de Campo Grande – MS para dirimir quaisquer dúvidas relacionadas a este termo.

-------------------------------------------
2. POLÍTICA DE PRIVACIDADE
-------------------------------------------

Esta Política de Privacidade explica como a BESAT coleta, utiliza e protege as informações pessoais dos usuários do site e clientes do produto TAGPRO+.

1. COLETA DE DADOS
Coletamos informações fornecidas pelo CLIENTE (nome, e-mail, telefone, endereço e dados de pagamento) e informações automáticas de navegação.

2. FINALIDADE
Os dados são utilizados para processar pedidos, emitir notas fiscais, fornecer suporte técnico e melhorar a experiência do usuário.

3. COMPARTILHAMENTO
A BESAT não compartilha dados pessoais com terceiros, exceto quando necessário para execução de serviços (Correios, meios de pagamento) ou por obrigação legal.

4. PROTEÇÃO DE DADOS
Adotamos medidas de segurança física, digital e administrativa para proteger as informações contra acessos não autorizados, perda ou alteração.

5. DIREITOS DO TITULAR
O CLIENTE pode solicitar a exclusão, correção ou portabilidade de seus dados conforme a Lei nº 13.709/2018 (LGPD).

6. COOKIES
Utilizamos cookies para melhorar a navegação e personalizar conteúdos. O CLIENTE pode desativá-los no navegador a qualquer momento.

7. CONTATO
Em caso de dúvidas, entre em contato pelo e-mail: suporte@besat.com.br

8. ATUALIZAÇÕES
Esta Política poderá ser atualizada periodicamente. A versão mais recente estará sempre disponível no site.

-------------------------------------------
3. POLÍTICA DE TROCAS, DEVOLUÇÕES E REEMBOLSOS
-------------------------------------------

1. PRAZO DE DEVOLUÇÃO
O CLIENTE tem até 14 (quatorze) dias corridos após o recebimento do produto para solicitar devolução e reembolso total, conforme o Código de Defesa do Consumidor.

2. CONDIÇÕES
O produto deve ser devolvido com todos os itens originais, sem sinais de uso ou danos, e com embalagem original.

3. PROCEDIMENTO
A solicitação deve ser feita por e-mail ou WhatsApp oficial da BESAT, informando número do pedido e motivo da devolução.

4. TROCAS
Em caso de defeito de fabricação dentro do prazo de garantia, o produto será substituído sem custo adicional.

5. REEMBOLSO
O reembolso será efetuado via mesma forma de pagamento utilizada, após análise do produto devolvido.

6. EXCEÇÕES
Não serão aceitas devoluções por mau uso, danos físicos, umidade ou violação de lacre.

-------------------------------------------
4. POLÍTICA DE ENTREGAS
-------------------------------------------

1. PRAZO DE ENTREGA
Os pedidos são enviados em até 3 dias úteis após a confirmação do pagamento, com prazos médios de 4 a 15 dias úteis para entrega pelos Correios.

2. ACOMPANHAMENTO
O CLIENTE recebe o código de rastreio por e-mail e WhatsApp assim que o pedido é despachado.

3. ATRASOS
A BESAT não se responsabiliza por atrasos ocasionados pelos Correios, greves ou endereços incorretos.

4. RESPONSABILIDADE
O CLIENTE é responsável por informar corretamente o endereço de entrega. Em caso de devolução por erro de endereço, será cobrado novo frete.

5. RECEBIMENTO
É necessário que alguém esteja no local para receber o pedido. Após três tentativas de entrega sem sucesso, o produto retornará ao remetente.

-------------------------------------------
5. AVISO LEGAL (DISCLAIMER)
-------------------------------------------

O rastreador TAGPRO+ é um dispositivo de localização eletrônica com função informativa e tecnológica.

1. NATUREZA DO PRODUTO
O serviço de rastreamento prestado pela BESAT não constitui apólice de seguro, contrato de monitoramento, vigilância ou serviço de emergência.

2. LIMITAÇÃO DE RESPONSABILIDADE
A BESAT não garante a recuperação de veículos, objetos ou bens furtados, nem indenização por perdas, danos ou prejuízos.

3. FUNCIONAMENTO
O equipamento depende da disponibilidade de sinal GPS e de rede móvel. Falhas de comunicação podem ocorrer em áreas sem cobertura.

4. USO RESPONSÁVEL
É proibido o uso do dispositivo para fins ilícitos, vigilância indevida ou monitoramento de terceiros sem consentimento.

5. CONSENTIMENTO
Ao adquirir e ativar o produto, o CLIENTE declara ciência e concordância com estas condições.

-------------------------------------------
FIM DO DOCUMENTO
-------------------------------------------

BESAT SOLUÇÕES EM RASTREAMENTO
CNPJ: 32.198.464/0001-40
Campo Grande/MS
E-mail: suporte@besat.com.br`;

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Políticas Legais</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>{PRIVACY_CONTENT}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceHighlight,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
