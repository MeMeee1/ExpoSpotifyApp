import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Track from "@/components/Track";
import { useRouter } from "expo-router"; // Add this import

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function LibraryScreen() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [descUpdating, setDescUpdating] = useState(false);

  // Animation for playlist tracks modal
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter(); // Add this line

  // Fetch playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlaylists(data.items || []);
      setLoading(false);
    };
    fetchPlaylists();
  }, [creating]);

  // Create playlist
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    const token = await AsyncStorage.getItem("token");
    const userRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await userRes.json();
    await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newPlaylistName }),
    });
    setNewPlaylistName("");
    setCreating(false);
    setModalVisible(false);
  };

  // Remove playlist (unfollow)
  const removePlaylist = async (playlistId: string) => {
    Alert.alert(
      "Remove Playlist",
      "Spotify does not allow deleting playlists via API. You can unfollow it instead.",
      [
        {
          text: "Unfollow",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            setPlaylists(playlists.filter((p) => p.id !== playlistId));
            setSelectedPlaylist(null);
            setPlaylistTracks([]);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // Get all tracks in a playlist
  const getPlaylistTracks = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setTracksLoading(true);
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setPlaylistTracks(data.items || []);
    setTracksLoading(false);

    // Animate modal in (centered)
    slideAnim.setValue(SCREEN_HEIGHT);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close playlist tracks modal with animation
  const closeTracksModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPlaylist(null);
      setPlaylistTracks([]);
    });
  };

  // Update playlist description
  const updatePlaylistDescription = async () => {
    if (!selectedPlaylist) return;
    setDescUpdating(true);
    const token = await AsyncStorage.getItem("token");
    await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: descInput }),
    });
    setDescUpdating(false);
    setDescModalVisible(false);
    setCreating((c) => !c);
  };

  // Remove track from playlist
  const removeTrackFromPlaylist = async (trackUri: string) => {
    if (!selectedPlaylist) return;
    const token = await AsyncStorage.getItem("token");
    await fetch(
      `https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracks: [{ uri: trackUri }],
        }),
      }
    );
    setPlaylistTracks((tracks) =>
      tracks.filter((t) => t.track.uri !== trackUri)
    );
  };

  // Confirm track removal
  const confirmRemoveTrack = (trackUri: string, trackName: string) => {
    Alert.alert(
      "Remove Track",
      `Are you sure you want to remove "${trackName}" from this playlist?`,
      [
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeTrackFromPlaylist(trackUri),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Playlists</Text>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={32} color={Colors.green} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.green} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playlistCard}
              onPress={() => router.push({ pathname: "/(playlist)/[id]", params: { id: item.id } })}
              activeOpacity={0.7}
            >
              {/* Playlist image */}
              {item.images && item.images[0]?.url ? (
                <Image
                  source={{ uri: item.images[0].url }}
                  style={styles.playlistImage}
                />
              ) : (
                <View style={styles.playlistImagePlaceholder}>
                  <Ionicons name="musical-notes" size={28} color={Colors.lightGray} />
                </View>
              )}
              <Text style={styles.playlistName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
              <View style={styles.playlistActions}>
                {/* Removed edit button */}
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    removePlaylist(item.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={22} color={Colors.lightGray} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal for creating playlist */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name"
              placeholderTextColor={Colors.lightGray}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.createButton]} 
                onPress={createPlaylist}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal for updating playlist description */}
      <Modal visible={descModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDescModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist description"
              placeholderTextColor={Colors.lightGray}
              value={descInput}
              onChangeText={setDescInput}
              autoFocus
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={() => setDescModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.createButton]} 
                onPress={updatePlaylistDescription}
                disabled={descUpdating}
              >
                {descUpdating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Playlist tracks modal */}
      <Modal
        visible={!!selectedPlaylist}
        transparent
        animationType="none"
        onRequestClose={closeTracksModal}
      >
        <Pressable style={styles.centeredOverlay} onPress={closeTracksModal}>
          <Animated.View
            style={[
              styles.centeredModalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.tracksModalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
                {selectedPlaylist?.name || "Playlist"}
              </Text>
              {selectedPlaylist?.description && (
                <Text style={styles.playlistDescription} numberOfLines={2} ellipsizeMode="tail">
                  {selectedPlaylist?.description}
                </Text>
              )}
            </View>
            
            {tracksLoading ? (
              <ActivityIndicator color={Colors.green} size="large" />
            ) : (
              <FlatList
                data={playlistTracks}
                keyExtractor={(item, index) => item.track.id + index}
                contentContainerStyle={styles.tracksList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No tracks in this playlist.</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.trackItem}>
                    <Track
                      track={item.track}
                      showOptions={false}
                      onPress={() => {}}
                      
                    />
                    <TouchableOpacity
                      onPress={() => confirmRemoveTrack(item.track.uri, item.track.name)}
                      style={styles.trackDeleteButton}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                      <Ionicons name="trash" size={20} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            
            <TouchableOpacity 
              onPress={closeTracksModal} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  headerText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.darkGray,
    marginVertical: 6,
    borderRadius: 10,
    padding: 16,
    minHeight: 60,
  },
  playlistName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  playlistActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.darkGray,
    color: Colors.white,
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 20,
    fontSize: 16,
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
    minWidth: 120,
  },
  createButton: {
    backgroundColor: Colors.green,
  },
  cancelButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  centeredModalContent: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  tracksModalHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray,
  },
  playlistDescription: {
    color: Colors.lightGray,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  tracksList: {
    paddingBottom: 16,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  trackComponent: {
    flex: 1,
  },
  trackDeleteButton: {
    marginLeft: 12,
    padding: 8,
  },
  emptyText: {
    color: Colors.lightGray,
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray,
  },
  closeButtonText: {
    color: Colors.green,
    fontSize: 16,
    fontWeight: "bold",
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
});