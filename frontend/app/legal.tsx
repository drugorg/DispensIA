import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

type Section = { heading?: string; body: string };
type PageContent = { title: string; sections: Section[] };

const CONTENT: Record<string, Record<string, PageContent>> = {
  it: {
    info: {
      title: 'Informazioni',
      sections: [
        {
          body: 'DispensIA trasforma video di ricette dai social media in schede strutturate, pronte da usare in cucina. Incolla un link, l\'AI analizza il video e restituisce titolo, ingredienti e preparazione in modo ordinato.',
        },
        {
          heading: 'Come funziona',
          body: 'L\'app scarica la descrizione e, se disponibile, l\'audio del video. GPT-4o estrae la ricetta e la struttura. Whisper trascrive l\'audio quando la descrizione da sola non basta. Nessun video viene archiviato permanentemente.',
        },
        {
          heading: 'Piattaforme supportate',
          body: 'TikTok e Instagram (Reels, Post video e Post foto con descrizione ricetta). Il profilo del creator deve essere pubblico.',
        },
        {
          heading: 'Contatti',
          body: 'Per assistenza o feedback: info@dispensia.app',
        },
        {
          heading: 'Versione',
          body: 'DispensIA 1.0.0\nfatto con ❤️ e AI',
        },
      ],
    },
    privacy: {
      title: 'Privacy & Dati',
      sections: [
        {
          heading: 'Cosa raccogliamo',
          body: 'Raccogliamo il tuo indirizzo email (per l\'autenticazione), i link ai video che condividi e le ricette estratte dall\'AI. Non raccogliamo dati di navigazione, informazioni di pagamento o dati sensibili.',
        },
        {
          heading: 'Come usiamo i tuoi dati',
          body: 'I tuoi dati vengono usati esclusivamente per fornire il servizio. Non vendiamo, condividiamo o cediamo i tuoi dati a terze parti per scopi commerciali.',
        },
        {
          heading: 'Servizi di terze parti',
          body: '• Clerk – autenticazione sicura\n• OpenAI – estrazione AI delle ricette (i file audio non vengono archiviati dopo l\'elaborazione)\n• MongoDB Atlas – archiviazione sicura dei dati in Europa',
        },
        {
          heading: 'I tuoi diritti (GDPR)',
          body: 'Hai diritto di accedere, modificare o cancellare in qualsiasi momento i dati associati al tuo account. Per esercitare questi diritti scrivi a: privacy@dispensia.app',
        },
        {
          heading: 'Sicurezza',
          body: 'Tutte le comunicazioni avvengono tramite HTTPS. Le credenziali di autenticazione sono gestite da Clerk, certificato SOC 2 Type II.',
        },
        {
          heading: 'Aggiornamenti',
          body: 'Questa informativa può essere aggiornata. Le modifiche significative saranno notificate tramite l\'app.',
        },
      ],
    },
    tos: {
      title: 'Termini di Servizio',
      sections: [
        {
          heading: 'Accettazione',
          body: 'Usando DispensIA accetti i presenti termini. Se non sei d\'accordo, ti chiediamo di non utilizzare il servizio.',
        },
        {
          heading: 'Uso del servizio',
          body: 'DispensIA è destinata esclusivamente all\'uso personale. È vietato utilizzare l\'app per scopi commerciali, redistributivi o automatizzati.',
        },
        {
          heading: 'Contenuti di terze parti',
          body: 'Le ricette vengono estratte da contenuti pubblici su social media. DispensIA non rivendica la proprietà intellettuale delle ricette originali, che appartengono ai rispettivi autori. Ti invitiamo a citare la fonte quando condividi le ricette.',
        },
        {
          heading: 'Accuratezza delle ricette',
          body: 'L\'estrazione tramite AI può contenere imprecisioni o omissioni. DispensIA non garantisce l\'accuratezza o la completezza delle ricette estratte. Verifica sempre gli ingredienti e i passaggi prima di cucinare.',
        },
        {
          heading: 'Limitazione di responsabilità',
          body: 'Il servizio viene fornito "così com\'è". Non siamo responsabili di danni diretti o indiretti derivanti dall\'uso o dall\'impossibilità di usare il servizio.',
        },
        {
          heading: 'Modifiche ai termini',
          body: 'Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. L\'uso continuato dell\'app dopo la pubblicazione delle modifiche costituisce accettazione.',
        },
        {
          heading: 'Legge applicabile',
          body: 'I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il foro di Milano.',
        },
      ],
    },
  },
  en: {
    info: {
      title: 'Information',
      sections: [
        {
          body: 'DispensIA turns recipe videos from social media into structured recipe cards, ready to use in the kitchen. Paste a link, and the AI analyses the video and returns the title, ingredients and preparation steps in a clean format.',
        },
        {
          heading: 'How it works',
          body: 'The app fetches the description and, where available, the audio of the video. GPT-4o extracts and structures the recipe. Whisper transcribes the audio when the description alone is not enough. No video is permanently stored.',
        },
        {
          heading: 'Supported platforms',
          body: 'TikTok and Instagram (Reels, video Posts and photo Posts with recipe description). The creator\'s profile must be public.',
        },
        {
          heading: 'Contact',
          body: 'For support or feedback: info@dispensia.app',
        },
        {
          heading: 'Version',
          body: 'DispensIA 1.0.0\nmade with ❤️ and AI',
        },
      ],
    },
    privacy: {
      title: 'Privacy & Data',
      sections: [
        {
          heading: 'What we collect',
          body: 'We collect your email address (for authentication), the video links you share, and the recipes extracted by the AI. We do not collect browsing data, payment information or sensitive data.',
        },
        {
          heading: 'How we use your data',
          body: 'Your data is used solely to provide the service. We do not sell, share or transfer your data to third parties for commercial purposes.',
        },
        {
          heading: 'Third-party services',
          body: '• Clerk – secure authentication\n• OpenAI – AI recipe extraction (audio files are not stored after processing)\n• MongoDB Atlas – secure data storage in Europe',
        },
        {
          heading: 'Your rights (GDPR)',
          body: 'You have the right to access, modify or delete your account data at any time. To exercise these rights write to: privacy@dispensia.app',
        },
        {
          heading: 'Security',
          body: 'All communications are transmitted via HTTPS. Authentication credentials are managed by Clerk, certified SOC 2 Type II.',
        },
        {
          heading: 'Updates',
          body: 'This policy may be updated. Significant changes will be notified through the app.',
        },
      ],
    },
    tos: {
      title: 'Terms of Service',
      sections: [
        {
          heading: 'Acceptance',
          body: 'By using DispensIA you agree to these terms. If you disagree, please do not use the service.',
        },
        {
          heading: 'Use of service',
          body: 'DispensIA is intended for personal use only. Using the app for commercial, redistributive or automated purposes is prohibited.',
        },
        {
          heading: 'Third-party content',
          body: 'Recipes are extracted from public content on social media. DispensIA does not claim intellectual property over the original recipes, which belong to their respective authors. We encourage you to credit the source when sharing recipes.',
        },
        {
          heading: 'Recipe accuracy',
          body: 'AI extraction may contain inaccuracies or omissions. DispensIA does not guarantee the accuracy or completeness of extracted recipes. Always verify ingredients and steps before cooking.',
        },
        {
          heading: 'Limitation of liability',
          body: 'The service is provided "as is". We are not liable for direct or indirect damages arising from the use or inability to use the service.',
        },
        {
          heading: 'Changes to terms',
          body: 'We reserve the right to modify these terms at any time. Continued use of the app after changes are published constitutes acceptance.',
        },
        {
          heading: 'Governing law',
          body: 'These terms are governed by Italian law. The courts of Milan have exclusive jurisdiction over any dispute.',
        },
      ],
    },
  },
};

export default function LegalScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const { i18n } = useTranslation();

  const lang = CONTENT[i18n.language] ? i18n.language : 'en';
  const content = CONTENT[lang][page as string] ?? CONTENT[lang].info;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {content.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading && <Text style={styles.heading}>{s.heading}</Text>}
            <Text style={styles.bodyText}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 40, gap: 24 },
  section: { gap: 8 },
  heading: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bodyText: { color: colors.text2, fontSize: 14, lineHeight: 22 },
});
