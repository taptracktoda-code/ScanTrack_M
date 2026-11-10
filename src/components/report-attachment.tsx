import { ThemedText } from '@/components/themed-text';
import { useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';

export function ReportAttachment({ file }: { file: { name: string; size: number; url: string } }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const image = /\.(jpe?g|png|webp)$/i.test(file.name);
  return <View style={{ marginVertical: 12 }}>
    <ThemedText>{file.name} ({Math.ceil(file.size / 1024)} KB)</ThemedText>
    {image ? <>
      {failedUrl !== file.url && <Image source={{ uri: file.url }} accessibilityLabel={`Report photo: ${file.name}`} resizeMode="contain" style={{ width: '100%', height: 280, backgroundColor: '#F1F5F9', borderRadius: 10, marginTop: 8 }} onError={() => setFailedUrl(file.url)} />}
      {failedUrl === file.url && <ThemedText accessibilityRole="alert">Unable to load photo. Refresh the reports to try again.</ThemedText>}
    </> : <Pressable accessibilityRole="link" onPress={async () => {
      try { await Linking.openURL(file.url); }
      catch { setFailedUrl(file.url); }
    }} style={{ paddingVertical: 12 }}><ThemedText>Open {file.name}</ThemedText></Pressable>}
    {!image && failedUrl === file.url && <ThemedText accessibilityRole="alert">Unable to open attachment. Refresh the reports and try again.</ThemedText>}
  </View>;
}
