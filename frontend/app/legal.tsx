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
          body: 'L\'app legge la descrizione del video e, per gli utenti Premium, può anche analizzarne l\'audio. GPT-4o estrae e struttura la ricetta. Whisper trascrive l\'audio quando la descrizione da sola non basta. Nessun video viene archiviato permanentemente.',
        },
        {
          heading: 'Piano gratuito',
          body: '3 estrazioni al giorno dalla descrizione del video, con pubblicità. Puoi guardare un video pubblicitario per ottenere +1 estrazione bonus.',
        },
        {
          heading: 'DispensIA Pro',
          body: '€2,99/mese (con 3 giorni di prova gratuita per i nuovi utenti). Sblocca: estrazione automatica dall\'audio del video, niente pubblicità, fino a 20 ricette al giorno.',
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
          body: 'DispensIA 1.3.0',
        },
      ],
    },
    privacy: {
      title: 'Privacy & Dati',
      sections: [
        {
          heading: 'Cosa raccogliamo',
          body: 'Raccogliamo il tuo indirizzo email (per l\'autenticazione), i link ai video che condividi, le ricette estratte dall\'AI e dei contatori di utilizzo (numero di estrazioni effettuate al giorno). Non raccogliamo dati di pagamento, dati di navigazione web o dati sanitari.',
        },
        {
          heading: 'Come usiamo i tuoi dati',
          body: 'I tuoi dati personali vengono usati esclusivamente per fornire il servizio. Non vendiamo né cediamo i tuoi dati a terze parti per profilazione commerciale.',
        },
        {
          heading: 'Pubblicità (utenti gratuiti)',
          body: 'Utilizziamo Google AdMob per mostrare annunci agli utenti del piano gratuito. AdMob può accedere a un identificatore pubblicitario del dispositivo (IDFA su iOS, Advertising ID su Android) per limitare la frequenza delle inserzioni e prevenire frodi. Mostriamo solo annunci NON personalizzati: nessun dato comportamentale dell\'utente viene inviato a Google per profilazione. Puoi ripristinare l\'identificatore pubblicitario in qualsiasi momento dalle impostazioni del tuo dispositivo. Sottoscrivendo DispensIA Pro le pubblicità vengono completamente disabilitate.',
        },
        {
          heading: 'Pagamenti e abbonamenti',
          body: 'Gli abbonamenti DispensIA Pro vengono gestiti da Apple App Store e Google Play. DispensIA non riceve né archivia informazioni di pagamento (numeri di carta, IBAN, ecc.). Lo stato dell\'abbonamento (attivo/scaduto) viene sincronizzato tramite RevenueCat, che riceve dagli store solo l\'ID utente e l\'identificativo del prodotto sottoscritto.',
        },
        {
          heading: 'Servizi di terze parti',
          body: '• Clerk – autenticazione sicura\n• OpenAI – estrazione AI delle ricette (i file audio non vengono archiviati dopo l\'elaborazione)\n• MongoDB Atlas – archiviazione sicura dei dati in Europa\n• RevenueCat – gestione dello stato degli abbonamenti\n• Google AdMob – pubblicità non personalizzata (solo utenti gratuiti)',
        },
        {
          heading: 'I tuoi diritti (GDPR)',
          body: 'Hai diritto di accedere, modificare, esportare o cancellare in qualsiasi momento i dati associati al tuo account. La cancellazione dell\'account è definitiva ed elimina tutte le tue ricette e contatori. Per esercitare questi diritti scrivi a: info@dispensia.app',
        },
        {
          heading: 'Sicurezza',
          body: 'Tutte le comunicazioni avvengono tramite HTTPS. Le credenziali di autenticazione sono gestite da Clerk, certificato SOC 2 Type II. I dati sono archiviati in data center europei.',
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
          body: 'DispensIA è destinata esclusivamente all\'uso personale. È vietato utilizzare l\'app per scopi commerciali, redistributivi o automatizzati (es. scraping, bot).',
        },
        {
          heading: 'Piano gratuito e Premium',
          body: 'DispensIA offre un piano gratuito (3 estrazioni al giorno dalla descrizione del video, con pubblicità) e un piano DispensIA Pro a pagamento (€2,99/mese, fino a 20 estrazioni/giorno, estrazione da audio, nessuna pubblicità). I limiti possono essere aggiornati nel tempo.',
        },
        {
          heading: 'Abbonamento e rinnovo',
          body: 'L\'abbonamento DispensIA Pro è mensile a rinnovo automatico al prezzo di €2,99 (o equivalente nella tua valuta locale). Per i nuovi utenti è prevista una prova gratuita di 3 giorni: l\'abbonamento parte solo al termine del trial, salvo disdetta. Il rinnovo avviene automaticamente alla fine di ogni periodo, salvo disdetta entro le 24 ore precedenti la scadenza.',
        },
        {
          heading: 'Cancellazione e rimborsi',
          body: 'Puoi disdire l\'abbonamento in qualsiasi momento dalle impostazioni del tuo account App Store o Google Play. La cancellazione ha effetto al termine del periodo già pagato. I rimborsi vengono gestiti esclusivamente da Apple e Google secondo le loro politiche; DispensIA non può emettere rimborsi diretti.',
        },
        {
          heading: 'Pubblicità e contenuti bonus',
          body: 'Gli utenti del piano gratuito visualizzano annunci pubblicitari forniti da Google AdMob. È possibile guardare volontariamente un breve video pubblicitario per ottenere un\'estrazione bonus aggiuntiva. Il numero di estrazioni bonus è limitato per giorno per evitare abusi.',
        },
        {
          heading: 'Contenuti di terze parti',
          body: 'Le ricette vengono estratte da contenuti pubblici su social media. DispensIA non rivendica la proprietà intellettuale delle ricette originali, che appartengono ai rispettivi autori. Ti invitiamo a citare la fonte quando condividi le ricette.',
        },
        {
          heading: 'Accuratezza delle ricette',
          body: 'L\'estrazione tramite AI può contenere imprecisioni o omissioni. DispensIA non garantisce l\'accuratezza o la completezza delle ricette estratte. Verifica sempre gli ingredienti e i passaggi prima di cucinare. Non utilizzare DispensIA se hai allergie alimentari gravi senza verificare gli ingredienti dalla fonte originale.',
        },
        {
          heading: 'Limitazione di responsabilità',
          body: 'Il servizio viene fornito "così com\'è". Non siamo responsabili di danni diretti o indiretti derivanti dall\'uso o dall\'impossibilità di usare il servizio, incluso il malfunzionamento dell\'estrazione AI o l\'indisponibilità temporanea del servizio.',
        },
        {
          heading: 'Modifiche ai termini',
          body: 'Ci riserviamo il diritto di modificare questi termini in qualsiasi momento, incluso il prezzo dell\'abbonamento e i limiti dei piani. Le modifiche saranno comunicate tramite l\'app con almeno 30 giorni di preavviso. L\'uso continuato dopo la pubblicazione costituisce accettazione.',
        },
        {
          heading: 'Legge applicabile',
          body: 'I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il foro di Milano. I diritti dei consumatori previsti dalla normativa europea (Codice del Consumo, Direttiva 2011/83/UE) restano garantiti.',
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
          body: 'The app reads the video description and, for Premium users, can also analyse its audio. GPT-4o extracts and structures the recipe. Whisper transcribes the audio when the description alone is not enough. No video is permanently stored.',
        },
        {
          heading: 'Free plan',
          body: '3 extractions per day from the video description, with ads. You can watch a short ad to earn +1 bonus extraction.',
        },
        {
          heading: 'DispensIA Pro',
          body: '€2.99/month (with a 3-day free trial for new users). Unlocks: automatic extraction from video audio, no ads, up to 20 recipes per day.',
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
          body: 'DispensIA 1.3.0',
        },
      ],
    },
    privacy: {
      title: 'Privacy & Data',
      sections: [
        {
          heading: 'What we collect',
          body: 'We collect your email address (for authentication), the video links you share, the recipes extracted by the AI and usage counters (number of daily extractions). We do not collect payment data, web browsing data or health data.',
        },
        {
          heading: 'How we use your data',
          body: 'Your personal data is used solely to provide the service. We do not sell or transfer your data to third parties for commercial profiling.',
        },
        {
          heading: 'Advertising (free users)',
          body: 'We use Google AdMob to show ads to users on the free plan. AdMob may access a device advertising identifier (IDFA on iOS, Advertising ID on Android) to limit ad frequency and prevent fraud. We display only NON-personalized ads: no behavioural data is sent to Google for profiling. You can reset the advertising identifier at any time from your device settings. Subscribing to DispensIA Pro completely disables ads.',
        },
        {
          heading: 'Payments and subscriptions',
          body: 'DispensIA Pro subscriptions are managed by Apple App Store and Google Play. DispensIA does not receive or store payment information (card numbers, IBAN, etc.). Subscription status (active/expired) is synchronized via RevenueCat, which receives only the user ID and the subscribed product identifier from the stores.',
        },
        {
          heading: 'Third-party services',
          body: '• Clerk – secure authentication\n• OpenAI – AI recipe extraction (audio files are not stored after processing)\n• MongoDB Atlas – secure data storage in Europe\n• RevenueCat – subscription state management\n• Google AdMob – non-personalized advertising (free users only)',
        },
        {
          heading: 'Your rights (GDPR)',
          body: 'You have the right to access, modify, export or delete your account data at any time. Account deletion is permanent and removes all your recipes and counters. To exercise these rights write to: info@dispensia.app',
        },
        {
          heading: 'Security',
          body: 'All communications are transmitted via HTTPS. Authentication credentials are managed by Clerk, certified SOC 2 Type II. Data is stored in European data centers.',
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
          body: 'DispensIA is intended for personal use only. Using the app for commercial, redistributive or automated purposes is prohibited (e.g. scraping, bots).',
        },
        {
          heading: 'Free and Premium plans',
          body: 'DispensIA offers a free plan (3 extractions per day from the video description, with ads) and a paid DispensIA Pro plan (€2.99/month, up to 20 extractions/day, audio-based extraction, ad-free). Limits may be adjusted over time.',
        },
        {
          heading: 'Subscription and renewal',
          body: 'The DispensIA Pro subscription is monthly auto-renewing at €2.99 (or equivalent in your local currency). New users get a 3-day free trial: the subscription only starts after the trial ends, unless cancelled. The subscription auto-renews at the end of each period unless cancelled at least 24 hours before expiration.',
        },
        {
          heading: 'Cancellation and refunds',
          body: 'You can cancel the subscription at any time from your App Store or Google Play account settings. Cancellation takes effect at the end of the already paid period. Refunds are handled exclusively by Apple and Google according to their policies; DispensIA cannot issue direct refunds.',
        },
        {
          heading: 'Ads and bonus content',
          body: 'Free plan users see advertising provided by Google AdMob. You can voluntarily watch a short ad to earn an extra bonus extraction. The number of bonus extractions is capped per day to prevent abuse.',
        },
        {
          heading: 'Third-party content',
          body: 'Recipes are extracted from public content on social media. DispensIA does not claim intellectual property over the original recipes, which belong to their respective authors. We encourage you to credit the source when sharing recipes.',
        },
        {
          heading: 'Recipe accuracy',
          body: 'AI extraction may contain inaccuracies or omissions. DispensIA does not guarantee the accuracy or completeness of extracted recipes. Always verify ingredients and steps before cooking. Do not use DispensIA if you have severe food allergies without verifying ingredients from the original source.',
        },
        {
          heading: 'Limitation of liability',
          body: 'The service is provided "as is". We are not liable for direct or indirect damages arising from the use or inability to use the service, including AI extraction malfunctions or temporary service unavailability.',
        },
        {
          heading: 'Changes to terms',
          body: 'We reserve the right to modify these terms at any time, including subscription pricing and plan limits. Changes will be communicated through the app at least 30 days in advance. Continued use after publication constitutes acceptance.',
        },
        {
          heading: 'Governing law',
          body: 'These terms are governed by Italian law. The courts of Milan have exclusive jurisdiction over any dispute. Consumer rights provided by EU regulations (Italian Consumer Code, Directive 2011/83/EU) remain guaranteed.',
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
