import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import Track from "@/components/Track";
import { Ionicons } from "@expo/vector-icons";
import { Fonts } from "@/constants/Fonts";

const RECOMMENDED_TRACK_IDS = [
  "7ouMYWpwJ422jRcDASZB7P", // "Viva La Vida" by Coldplay
  "4VqPOruhp5EdPBeR92t6lQ", // "Blinding Lights" by The Weeknd
  "2takcwOaAZWiXQijPHIx7B", // "Save Your Tears" by The Weeknd
  "6f3Slt0GbA2bPZlz0aIFXN", // "Levitating" by Dua Lipa
  "1dGr1c8CrMLDpV6mPbImSI", // "Stay" by The Kid LAROI, Justin Bieber
];

export default function PlaylistDetailScreen() {
  const route = useRoute<any>();
  const router = useRouter();
  const playlistId = route.params?.id;

  const [playlist, setPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingTrackId, setRemovingTrackId] = useState<string | null>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !playlistId) return;

      const [playlistRes, tracksRes] = await Promise.all([
        fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const playlistData = await playlistRes.json();
      const trackData = await tracksRes.json();

      setPlaylist(playlistData);
      setEditName(playlistData.name);
      setEditDescription(playlistData.description || "");
      setTracks(trackData.items || []);
      setLoading(false);
    };

    fetchPlaylistDetails();
  }, [playlistId]);

  // Fetch recommended tracks if playlist is empty
  useEffect(() => {
    const fetchRecommendedTracks = async () => {
      if (tracks.length > 0) return;
      setLoadingRecommended(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const ids = RECOMMENDED_TRACK_IDS.join(",");
      const res = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${ids}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setRecommendedTracks(data.tracks || []);
      setLoadingRecommended(false);
    };
    fetchRecommendedTracks();
  }, [tracks]);

  const removeTrackFromPlaylist = async (trackUri: string, trackName: string) => {
    Alert.alert(
      "Remove Track",
      `Are you sure you want to remove "${trackName}" from this playlist?`,
      [
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingTrackId(trackUri);
            const token = await AsyncStorage.getItem("token");
            await fetch(
              `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
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
            setTracks((tracks) =>
              tracks.filter((t) => t.track.uri !== trackUri)
            );
            setRemovingTrackId(null);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openEditModal = () => {
    setEditName(playlist.name);
    setEditDescription(playlist.description || "");
    setEditModalVisible(true);
  };

  const updatePlaylistDetails = async () => {
    if (!playlistId || !editName.trim()) return;
    
    setIsUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            description: editDescription,
          }),
        }
      );

      if (response.ok) {
        setPlaylist({
          ...playlist,
          name: editName,
          description: editDescription,
        });
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error("Failed to update playlist:", error);
      Alert.alert("Error", "Failed to update playlist details");
    } finally {
      setIsUpdating(false);
    }
  };

  // Add track to playlist functionality
  const addTrackToPlaylist = async (trackUri: string) => {
    if (!playlistId) return;
    setAddingTrackId(trackUri);
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
            uris: [trackUri],
          }),
        }
      );
      if (response.ok) {
        // Optionally, fetch the updated playlist tracks
        setTracks((prev) => [
          ...prev,
          { track: recommendedTracks.find((t) => t.uri === trackUri) },
        ]);
        Alert.alert("Added!", "Track added to playlist.");
      } else {
        Alert.alert("Error", "Failed to add track to playlist.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add track to playlist.");
    } finally {
      setAddingTrackId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    );
  }

  const hasImage = playlist?.images && playlist.images.length > 0 && playlist.images[0]?.url;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop:
          (Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 24)) + 16,
      }}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Playlist header */}
      <View style={styles.header}>
        {hasImage ? (
          <Image
            source={{ uri: playlist.images[0].url }}
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.iconCover}>
            <Ionicons name="book" size={90} color={Colors.lightGray} />
          </View>
        )}
        <Text style={styles.title}>{playlist.name}</Text>
        <Text style={styles.description}>
          {playlist.description ? playlist.description == "null"? "No description" : playlist.descripition :" No description"}
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={openEditModal}
        >
          <Text style={styles.editButtonText}>Edit Playlist</Text>
        </TouchableOpacity>
      </View>
 
      {/* Track list */}
      <View style={styles.content}>
        {tracks.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Songs</Text>
            <FlatList
              data={tracks}
              keyExtractor={(item, index) => item.track?.id + index}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.trackRow}>
                  <Track
                    track={{ ...item.track, playlistId: playlistId }}
                    showOptions={true}
                    enableRemoveFromPlaylist={true}
                  />
                  <TouchableOpacity
                    style={styles.removeTrackBtn}
                    onPress={() =>
                      removeTrackFromPlaylist(item.track.uri, item.track.name)
                    }
                    disabled={removingTrackId === item.track.uri}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {removingTrackId === item.track.uri ? (
                      <ActivityIndicator size={18} color={Colors.red} />
                    ) : (
                      <Ionicons name="close-circle" size={24} color={Colors.red} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>This playlist is empty</Text>
            <Ionicons name="book" size={48} color={Colors.lightGray} style={styles.emptyIcon} />
            <Text style={styles.recommendationTitle}>Recommended Songs</Text>
            <Text style={styles.recommendationSubtitle}>
              Add some of these popular tracks to get started
            </Text>
            {loadingRecommended ? (
              <ActivityIndicator color={Colors.green} style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.recommendedContainer}>
                {recommendedTracks.map((track) => (
                  <View key={track.id} style={styles.recommendedTrackRow}>
                    <View style={styles.trackStyle}>
                      <Track
                        track={track}
                        showOptions={false}
                        onPress={() => {}}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => addTrackToPlaylist(track.uri)}
                      disabled={addingTrackId === track.uri}
                    >
                      {addingTrackId === track.uri ? (
                        <ActivityIndicator size={24} color={Colors.green} />
                      ) : (
                        <Ionicons name="add-circle" size={32} color={Colors.green} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Edit Playlist Modal */}
      <Modal
        visible={editModalVisible}
        transparent={false} // Make modal cover the full screen
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <Pressable style={styles.fullScreenModalContent}>
            <Text style={styles.modalTitle}>Edit Playlist</Text>
            
            <Text style={styles.inputLabel}>Playlist Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter playlist name"
              placeholderTextColor={Colors.lightGray}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Enter playlist description"
              placeholderTextColor={Colors.lightGray}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={isUpdating}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={updatePlaylistDetails}
                disabled={isUpdating || !editName.trim()}
              >
                {isUpdating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 24) + 8,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    padding: 20,
    paddingTop: 32,
  },
  coverImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  iconCover: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.darkGray,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: Colors.white,
    fontFamily:Fonts.bold,
    textAlign: "center",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: Colors.darkGray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily:Fonts.bold,
    marginVertical: 16,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  removeTrackBtn: {
    marginLeft: 8,
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    color: Colors.white,
    fontSize: 18,
   fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  recommendationTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily:Fonts.bold,
    marginTop: 24,
    marginBottom: 8,
  },
  recommendationSubtitle: {
    color: Colors.lightGray,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  recommendedContainer: {
    width: "100%",
  },
  recommendedTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 8,
  },
  trackStyle: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily:Fonts.bold,
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.darkGray,
    color: Colors.white,
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  saveButton: {
    backgroundColor: Colors.green,
  },
  cancelButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonText: {
    color: Colors.white,
    fontFamily:Fonts.bold,
    fontSize: 16,
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    padding: 0,
  },
  fullScreenModalContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    padding: 24,
  },
});