import { ThemedText } from '@/components/themed-text';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

interface ProfilePicturePickerProps {
  imageUri?: string | null;
  onChange: (uri: string, fileName: string) => Promise<void>;
  onRemove: () => Promise<void>;
  loading?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfilePicturePicker({ imageUri, onChange, onRemove, loading = false }: ProfilePicturePickerProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const extension = asset.fileName?.split('.').pop()?.toLowerCase();
    const extensionType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : null;
    const fileType = asset.mimeType || asset.file?.type || extensionType;
    const fileSize = asset.fileSize ?? asset.file?.size;

    if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
      Alert.alert('Unsupported image', 'Use JPG, PNG, or WebP images only.');
      return;
    }

    if (typeof fileSize === 'number' && fileSize > MAX_FILE_SIZE) {
      Alert.alert('Image too large', 'Choose an image smaller than 2 MB.');
      return;
    }

    await onChange(asset.uri, asset.fileName || asset.file?.name || `profile-picture.${fileType === 'image/png' ? 'png' : fileType === 'image/webp' ? 'webp' : 'jpg'}`);
  };

  return (
    <View style={styles.container}>
      <Pressable disabled={loading} onPress={pickImage} style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed, loading && styles.disabled]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.avatar} /> : <ThemedText style={styles.avatarFallback}>+</ThemedText>}
      </Pressable>
      <View style={styles.actions}>
        <Pressable disabled={loading} onPress={pickImage} style={styles.actionButton}><ThemedText style={styles.actionText}>{loading ? 'Saving...' : imageUri ? 'Change picture' : 'Upload picture'}</ThemedText></Pressable>
        {imageUri ? <Pressable disabled={loading} onPress={() => void onRemove()} style={styles.removeButton}><ThemedText style={styles.removeText}>Remove</ThemedText></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 22 },
  avatarButton: { width: 116, height: 116, borderRadius: 58, overflow: 'hidden', backgroundColor: '#DCEEFF', borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  avatar: { width: 116, height: 116 },
  avatarFallback: { color: '#208AEF', fontSize: 42, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { backgroundColor: '#208AEF', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 },
  actionText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  removeButton: { backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 },
  removeText: { color: '#B42318', fontSize: 12, fontWeight: '800' },
});
