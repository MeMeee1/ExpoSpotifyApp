import React, { useState, useRef } from "react";
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
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, Entypo, Feather, FontAwesome5 } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type TrackProps = {
  track: any;
  onPress?: () => void;
  showOptions?: boolean;
  onAddToPlaylist?: (track: any) => void;
  style?: any;
  enableRemoveFromPlaylist?: boolean; // <-- Add this prop
};

export default function Track({
  track,
  onPress,
  showOptions = true,
  style,
  enableRemoveFromPlaylist = false, // <-- Default to false
}: TrackProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [removing, setRemoving] = useState(false); // Add this state to handle removing
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
    }).start(() => {
      setModalVisible(false);
    });
  };

  const fetchPlaylists = async () => {
    setPlaylistModalVisible(true);
    setLoadingPlaylists(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Filter out playlists that already contain the track
      const playlistsWithTrackFiltered = await Promise.all(
        (data.items || []).map(async (playlist: any) => {
          // Check if track exists in playlist
          const trackRes = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?fields=items(track(id))&limit=100`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const trackData = await trackRes.json();
          const exists = (trackData.items || []).some(
            (item: any) => item.track && item.track.id === track.id
          );
          return exists ? null : playlist;
        })
      );
      setPlaylists(playlistsWithTrackFiltered.filter(Boolean));
    } catch (error) {
      setPlaylists([]);
    }
    setLoadingPlaylists(false);
  };

  const openPlaylistModal = async () => {
    closeOptions();
    setPlaylistModalVisible(true);
    setLoadingPlaylists(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Filter out playlists that already contain the track
      const playlistsWithTrackFiltered = await Promise.all(
        (data.items || []).map(async (playlist: any) => {
          // Check if track exists in playlist
          const trackRes = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?fields=items(track(id))&limit=100`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const trackData = await trackRes.json();
          const exists = (trackData.items || []).some(
            (item: any) => item.track && item.track.id === track.id
          );
          return exists ? null : playlist;
        })
      );
      setPlaylists(playlistsWithTrackFiltered.filter(Boolean));
    } catch (error) {
      setPlaylists([]);
    }
    setLoadingPlaylists(false);
  };

  const closePlaylistModal = () => {
    setPlaylistModalVisible(false);
    setCreating(false);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
  };

  const addTrackToPlaylist = async (playlistId: string) => {
    setAddingToPlaylistId(playlistId);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [track.uri],
            position: 0,
          }),
        }
      );

      if (response.ok) {
       // Alert.alert("Success", "Track added to playlist!");
        closePlaylistModal();
      } else {
        throw new Error("Failed to add track");
      }
    } catch (error) {
     // console.error("Error adding track to playlist:", error);
      //Alert.alert("Error", "Failed to add track to playlist");
    } finally {
      setAddingToPlaylistId(null);
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string) => {
    setRemoving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tracks: [{ uri: track.uri }],
          }),
        }
      );
      if (response.ok) {
        Alert.alert("Removed", "Track removed from playlist.");
        // Optionally, you can trigger a refresh or callback here
      } else {
        Alert.alert("Error", "Failed to remove track from playlist.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to remove track from playlist.");
    } finally {
      setRemoving(false);
    }
  };

  const createPlaylistAndAddTrack = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // First get user ID
      const userRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      const userId = userData.id;

      // Create new playlist
      const createRes = await fetch(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newPlaylistName,
            description: newPlaylistDesc || "",
            public: false,
          }),
        }
      );

      const newPlaylist = await createRes.json();
      if (newPlaylist.id) {
        // Add track to the newly created playlist
        await addTrackToPlaylist(newPlaylist.id);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      Alert.alert("Error", "Failed to create playlist");
    } finally {
      setCreating(false);
    }
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
        <Image
          source={{ uri: track.album?.images?.[0]?.url }}
          style={styles.trackImage}
        />
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artists?.map((a: any) => a.name).join(", ")}
          </Text>
          {track.album?.name && (
            <Text style={styles.trackAlbum} numberOfLines={1}>{track.album.name}</Text>
          )}
          {track.duration_ms && (
            <Text style={styles.trackDuration}>
              {Math.floor(track.duration_ms / 60000)}:
              {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0") }
            </Text>
          )}
        </View>
        {showOptions && (
          <TouchableOpacity onPress={openOptions} style={styles.optionsIcon}>
            <Entypo name="dots-three-vertical" size={16} color={Colors.white} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Track options modal */}
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
                description="Listen directly on the Spotify app"
                onPress={() => {
                  Linking.openURL(track.external_urls.spotify);
                  closeOptions();
                }}
              />
              <Option
                icon={<Ionicons name="add-circle-outline" size={20} color={Colors.green} />}
                label="Add to Playlist"
                description="Save this track to a playlist"
                onPress={openPlaylistModal}
              />
              {/* Remove from playlist option, only if enabled and playlistId is present */}
              {enableRemoveFromPlaylist && track.playlistId && (
                <Option
                  icon={<Ionicons name="remove-circle-outline" size={20} color={Colors.red} />}
                  label="Remove from Playlist"
                  description="Remove this track from the current playlist"
                  onPress={() => {
                    closeOptions();
                    removeTrackFromPlaylist(track.playlistId);
                  }}
                />
              )}
              <Option
                icon={<FontAwesome5 name="share-alt" size={18} color={Colors.green} />}
                label="Share"
                description="Send to a friend or post online"
                onPress={() => {
                  // Implement share logic here
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

      {/* Playlist selection modal */}
      <Modal
        visible={playlistModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closePlaylistModal}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.playlistHeader}>
            <Text style={styles.playlistTitle}>Add to Playlist</Text>
            <TouchableOpacity onPress={closePlaylistModal}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {loadingPlaylists ? (
            <ActivityIndicator color={Colors.green} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={() => addTrackToPlaylist(item.id)}
                  disabled={addingToPlaylistId === item.id}
                >
                  {item.images?.[0]?.url ? (
                    <Image source={{ uri: item.images[0].url }} style={styles.playlistImage} />
                  ) : (
                    <View style={styles.playlistImagePlaceholder}>
                      <Ionicons name="musical-notes" size={28} color={Colors.lightGray} />
                    </View>
                  )}
                  <Text style={styles.playlistName}>{item.name}</Text>
                  {addingToPlaylistId === item.id ? (
                    <ActivityIndicator color={Colors.green} style={{ marginLeft: 8 }} />
                  ) : (
                    <Ionicons name="add" size={24} color={Colors.green} />
                  )}
                </TouchableOpacity>
              )}
              // No create new playlist button
              ListFooterComponent={null}
            />
          )}
        </View>
      </Modal>
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
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 10,
  },
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
  trackDuration: {
    color: Colors.lightGray,
    fontFamily: Fonts.light,
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
  fullScreenModal: {
    flex: 1,
    backgroundColor: Colors.dark.background,
 
  },
  playlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray,
  },
  playlistTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray,
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 16,
  },
  playlistImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.darkGray,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  playlistName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  playlistTrackCount: {
    color: Colors.lightGray,
    fontSize: 14,
    marginTop: 4,
  },
  createPlaylistBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray,
  },
  createPlaylistText: {
    color: Colors.green,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  createForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray,
  },
  createTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  createInput: {
    backgroundColor: Colors.darkGray,
    color: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  createButton: {
    backgroundColor: Colors.green,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});