import { ThemedText } from '@/components/themed-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides: { title: string; description: string; icon: SymbolViewProps['name']; tag: string; details: { title: string; text: string }[] }[] = [
  {
    title: 'Hello, welcome to ScanTrack',
    description: 'Your terminal day, all in one place. A simpler way for TODA drivers and managers to stay connected.',
    icon: { ios: 'hand.wave.fill', android: 'waving_hand', web: 'waving_hand' },
    tag: 'LET’S GET YOU STARTED',
    details: [
      { title: 'For drivers', text: 'Access your QR code, attendance, queue updates, and trips.' },
      { title: 'For managers', text: 'Scan driver QR codes, manage the queue, and review reports.' },
    ],
  },
  {
    title: 'One QR code. A smoother check-in.',
    description: 'Open your driver QR code and present it to your manager at the terminal.',
    icon: { ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' },
    tag: 'SCAN & GO',
    details: [
      { title: 'Record your attendance', text: 'Your manager’s QR scan records terminal entry or exit.' },
      { title: 'Know your place', text: 'Check your queue position and waiting drivers from the dashboard.' },
    ],
  },
  {
    title: 'Stay on top of your day',
    description: 'From your first check-in to your last trip, keep your terminal activity within reach.',
    icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
    tag: 'READY WHEN YOU ARE',
    details: [
      { title: 'Track your trips', text: 'View trip activity and completed trip totals.' },
      { title: 'Have a concern?', text: 'Send a report to your manager. Choose Others for concerns even outside the queue.' },
      { title: 'Sign in to begin', text: 'Use your assigned account. Drivers can contact their TODA manager for login details.' },
    ],
  },
];

export function WelcomeOnboarding({ onComplete }: { onComplete: () => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { horizontalPadding, isShort } = useResponsiveLayout();
  const slide = slides[step];
  const last = step === slides.length - 1;
  const complete = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try { await onComplete(); }
    finally { pending.current = false; setBusy(false); }
  };
  const changeStep = (next: number) => {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return <SafeAreaView style={s.safe}>
    <View style={[s.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={s.header}>
        <View style={s.brand}>
          <SymbolView name={{ ios: 'qrcode', android: 'qr_code', web: 'qr_code' }} tintColor="#1D4ED8" size={25} />
          <ThemedText style={s.brandName}>SCAN TRACK</ThemedText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" disabled={busy} onPress={complete} style={s.skip}><ThemedText style={s.link}>Skip</ThemedText></Pressable>
      </View>

      <ScrollView ref={scroll} style={s.scroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, isShort && s.shortHero]}>
          <View style={s.orbit}>
            <View style={s.iconTile}><SymbolView name={slide.icon} tintColor="#FFFFFF" size={isShort ? 54 : 72} /></View>
          </View>
          <View style={s.heroBadge}><View style={s.statusDot} /><ThemedText style={s.badgeText}>Your TODA, connected</ThemedText></View>
        </View>
        <View accessibilityLiveRegion="polite">
          <ThemedText style={s.eyebrow}>{slide.tag}</ThemedText>
          <ThemedText accessibilityRole="header" style={s.title}>{slide.title}</ThemedText>
          <ThemedText style={s.description}>{slide.description}</ThemedText>
        </View>
        <View style={s.details}>
          {slide.details.map((detail, index) => <View key={detail.title} style={s.detail}>
            <View style={s.number}><ThemedText style={s.numberText}>{index + 1}</ThemedText></View>
            <View style={s.detailCopy}><ThemedText style={s.detailTitle}>{detail.title}</ThemedText><ThemedText style={s.detailText}>{detail.text}</ThemedText></View>
          </View>)}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View style={s.progress} accessibilityLabel={`Introduction step ${step + 1} of ${slides.length}`}>
          {slides.map((_, index) => <View key={index} style={[s.dot, step === index && s.activeDot]} />)}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={last ? complete : () => changeStep(step + 1)} style={({ pressed }) => [s.primary, (pressed || busy) && { opacity: 0.75 }]}>
          <ThemedText style={s.primaryText}>{busy ? 'Opening...' : last ? 'Get Started' : 'Next'}</ThemedText>
          <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor="#FFFFFF" size={20} />
        </Pressable>
        {step > 0 ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => changeStep(step - 1)} style={s.back}><ThemedText style={s.link}>Back</ThemedText></Pressable> : <ThemedText style={s.footerNote}>A better day starts with a simple scan.</ThemedText>}
      </View>
    </View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FB' },
  container: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandName: { color: '#14243A', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  skip: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  link: { color: '#52647B', fontSize: 14, fontWeight: '700' },
  scroll: { flex: 1 },
  body: { paddingBottom: 12 },
  hero: { minHeight: 230, alignItems: 'center', justifyContent: 'center', paddingVertical: 22 },
  shortHero: { minHeight: 165, paddingVertical: 12 },
  orbit: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#E4EDFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D5E3FF' },
  iconTile: { width: 114, height: 114, borderRadius: 32, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginTop: -8, borderWidth: 1, borderColor: '#E5EBF3' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  badgeText: { color: '#23354D', fontSize: 11, fontWeight: '700' },
  eyebrow: { color: '#1D4ED8', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 10 },
  title: { color: '#14243A', fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.8, marginBottom: 12 },
  description: { color: '#64748B', fontSize: 15, lineHeight: 23 },
  details: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E5EBF3', padding: 16, gap: 16, marginTop: 22 },
  detail: { flexDirection: 'row', gap: 12 },
  number: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#1D4ED8', fontSize: 12, fontWeight: '800' },
  detailCopy: { flex: 1 },
  detailTitle: { color: '#23354D', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  detailText: { color: '#64748B', fontSize: 12, lineHeight: 19 },
  footer: { paddingTop: 14, paddingBottom: 8 },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#CBD5E1' },
  activeDot: { width: 25, backgroundColor: '#1D4ED8' },
  primary: { minHeight: 54, backgroundColor: '#1D4ED8', borderRadius: 15, padding: 15, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  footerNote: { color: '#748198', fontSize: 11, textAlign: 'center', paddingVertical: 14 },
});
