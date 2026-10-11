import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Vídeo de 1min51 que explica o FocoMulta e a ciência por trás (marketing/video/ tem a fonte).
const VIDEO = require('@/assets/video/como-funciona.mp4');

export default function ComoFunciona() {
  const player = useVideoPlayer(VIDEO, (p) => p.play());
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0E1226' }}>
      <View style={{ flex: 1 }}>
        <VideoView player={player} nativeControls contentFit="contain" style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar vídeo"
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(14,18,38,0.7)', alignItems: 'center', justifyContent: 'center' }}
        >
          <X color="#EEF0FA" size={24} strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
