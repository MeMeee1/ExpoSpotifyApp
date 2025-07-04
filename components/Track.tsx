import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import {
  Ionicons,
  Entypo,
  Feather,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import * as Linking from "expo-linking";
import { Audio } from "expo-av";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type TrackProps = {
  track: any;
  onPress?: () => void;
  showOptions?: boolean;
  style?: any;
  enableRemoveFromPlaylist?: boolean;
};

export default function Track({
  track,
  onPress,
  showOptions = true,
  style,
}: TrackProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [nowPlayingVisible, setNowPlayingVisible] = useState(false);
  const [nowPlayingTrack, setNowPlayingTrack] = useState<any>(null);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);
  const [soundObj, setSoundObj] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Add effect to update playbackStatus every 500ms for progress bar
  useEffect(() => {
    let interval: any;
    if (nowPlayingVisible && soundObj && !isPaused) {
      interval = setInterval(async () => {
        const status = await soundObj.getStatusAsync();
        setPlaybackStatus(status);
        if (status.didJustFinish) {
          closeNowPlaying();
        }
      }, 500);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlayingVisible, soundObj, isPaused]);

  const openOptions = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeOptions = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const playPreviewFromDeezer = async () => {
    try {
      const title = track.name;
      const artist = track.artists?.[0]?.name;
      const query = encodeURIComponent(`${title} ${artist}`);
      const response = await fetch(`https://api.deezer.com/search?q=${query}`);
      const data = await response.json();
      const deezerTrack = data.data?.[0];

      if (deezerTrack?.preview) {
        if (soundObj) await soundObj.unloadAsync();

        const { sound } = await Audio.Sound.createAsync(
          { uri: deezerTrack.preview },
          { shouldPlay: true }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          setPlaybackStatus(status);
          if (status.isLoaded && status.didJustFinish) closeNowPlaying();
        });

        setSoundObj(sound);
        setNowPlayingTrack({
          ...deezerTrack,
          name: track.name,
          artists: track.artists,
          album: track.album,
        });
        setIsPaused(false);
        setNowPlayingVisible(true);
      } else {
        Alert.alert("Not Found", "Could not find a Deezer preview for this track.");
      }
    } catch (err) {
      console.error("Preview Error:", err);
      Alert.alert("Error", "Could not play preview.");
    }
  };

  const closeNowPlaying = async () => {
    setNowPlayingVisible(false);
    setNowPlayingTrack(null);
    setPlaybackStatus(null);
    if (soundObj) {
      await soundObj.stopAsync();
      await soundObj.unloadAsync();
      setSoundObj(null);
    }
  };

  // Pause/resume handler
  const togglePause = async () => {
    if (!soundObj) return;
    if (isPaused) {
      await soundObj.playAsync();
      setIsPaused(false);
    } else {
      await soundObj.pauseAsync();
      setIsPaused(true);
    }
  };

  // Skip by 10 seconds handler
  const skipBy = async (seconds: number) => {
    if (!soundObj || !playbackStatus) return;
    let newPosition = (playbackStatus.positionMillis || 0) + seconds * 1000;
    if (newPosition < 0) newPosition = 0;
    if (newPosition > 30000) newPosition = 30000;
    await soundObj.setPositionAsync(newPosition);
    setPlaybackStatus({ ...playbackStatus, positionMillis: newPosition });
  };

  const Option = ({ icon, label, description, onPress }: any) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <View style={styles.optionIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.trackCard, style]}
        activeOpacity={0.8}
        onPress={onPress ? onPress : () => Linking.openURL(track.external_urls.spotify)}
      >
        <Image source={{ uri: track.album?.images?.[0]?.url }} style={styles.trackImage} />
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artists?.map((a: any) => a.name).join(", ")}
          </Text>
          {track.album?.name && (
            <Text style={styles.trackAlbum} numberOfLines={1}>{track.album.name}</Text>
          )}
        </View>
        {showOptions && (
          <TouchableOpacity onPress={openOptions} style={styles.optionsIcon}>
            <Entypo name="dots-three-vertical" size={16} color={Colors.white} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {modalVisible && (
        <Modal transparent animationType="none" visible={modalVisible}>
          <Pressable style={styles.modalOverlay} onPress={closeOptions}>
            <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.modalHandle} />
              {track.album?.images?.[0]?.url && (
                <Image source={{ uri: track.album.images[0].url }} style={styles.modalImage} />
              )}
              <Text style={styles.modalTitle}>{track.name}</Text>

              <Option
                icon={<Feather name="external-link" size={20} color={Colors.green} />}
                label="Open in Spotify"
                description="Listen on the Spotify app"
                onPress={() => {
                  Linking.openURL(track.external_urls.spotify);
                  closeOptions();
                }}
              />
              <Option
                icon={<Ionicons name="musical-notes-outline" size={20} color={Colors.green} />}
                label="Play Preview"
                description="30s sample from Deezer"
                onPress={() => {
                  playPreviewFromDeezer();
                  closeOptions();
                }}
              />
              <Option
                icon={<FontAwesome5 name="share-alt" size={18} color={Colors.green} />}
                label="Share"
                description="Send to a friend"
                onPress={() => {
                  // Share logic
                  closeOptions();
                }}
              />
              <TouchableOpacity onPress={closeOptions}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      {nowPlayingVisible && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.nowPlayingOverlay}>
            <View style={styles.nowPlayingContainer}>
              <TouchableOpacity style={styles.nowPlayingClose} onPress={closeNowPlaying}>
                <AntDesign name="closecircle" size={28} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: nowPlayingTrack?.album?.images?.[0]?.url }}
                style={styles.nowPlayingImage}
              />
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                {nowPlayingTrack?.name}
              </Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                {nowPlayingTrack?.artists?.map((a: any) => a.name).join(", ")}
              </Text>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: playbackStatus?.positionMillis
                        ? `${(playbackStatus.positionMillis / 30000) * 100}%`
                        : "0%",
                    },
                  ]}
                />
              </View>
              <View style={styles.progressTimeRow}>
                <Text style={styles.progressTime}>
                  {playbackStatus
                    ? `${Math.floor((playbackStatus.positionMillis || 0) / 1000)}s`
                    : "0s"}
                </Text>
                <Text style={styles.progressTime}>30s</Text>
              </View>

              {/* Playback Controls */}
              <View style={{ flexDirection: "row", marginTop: 24, alignItems: "center", justifyContent: "center" }}>
                <TouchableOpacity onPress={() => skipBy(-10)} style={{ marginHorizontal: 24 }}>
                  <AntDesign name="banckward" size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePause} style={{ marginHorizontal: 24 }}>
                  <AntDesign name={isPaused ? "caretright" : "pausecircle"} size={48} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => skipBy(10)} style={{ marginHorizontal: 24 }}>
                  <AntDesign name="forward" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trackCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkGray,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
  },
  trackImage: { width: 60, height: 60, borderRadius: 8 },
  trackInfo: { flex: 1, marginLeft: 10 },
  trackName: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  trackArtist: {
    color: Colors.green,
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  trackAlbum: {
    color: Colors.lightGray,
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  optionsIcon: {
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.dark.background,
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.darkGray,
    alignSelf: "center",
    marginBottom: 10,
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  optionIcon: {
    width: 26,
    marginRight: 14,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.lightGray,
  },
  modalCancel: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: 20,
    textAlign: "center",
    fontFamily: Fonts.medium,
  },
  nowPlayingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  nowPlayingContainer: {
    width: "85%",
    backgroundColor: Colors.darkGray,
    borderRadius: 18,
    alignItems: "center",
    padding: 24,
  },
  nowPlayingClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
  },
  nowPlayingImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 18,
  },
  nowPlayingTitle: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginBottom: 4,
    textAlign: "center",
  },
  nowPlayingArtist: {
    color: Colors.green,
    fontFamily: Fonts.medium,
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.green,
    borderRadius: 3,
  },
  progressTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
  },
  progressTime: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
});
