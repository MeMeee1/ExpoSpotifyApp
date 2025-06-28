import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons, Entypo, Feather, FontAwesome5 } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import Track from "@/components/Track";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const debounceRef = useRef<number | null>(null);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!text) {
        setTracks([]);
        return;
      }
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          text
        )}&type=track&limit=10&market=ES`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks?.items || []);
      }
      setLoading(false);
    }, 500);
  };

  const clearSearch = () => {
    setQuery("");
    setTracks([]);
  };

  const openOptions = (track: any) => {
    setSelectedTrack(track);
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
      setSelectedTrack(null);
    });
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
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <StatusBar barStyle="light-content" />
      <View style={styles.searchBarWrapper}>
        <Ionicons
          name="search"
          size={22}
          color={Colors.lightGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchBar}
          placeholder="Search for tracks or artists"
          placeholderTextColor={Colors.lightGray}
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearIconWrapper}>
            <Ionicons name="close-circle" size={22} color={Colors.lightGray} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.green} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Track track={item} />
          )}
          ListEmptyComponent={
            query && !loading ? (
              <Text style={styles.noResults}>No results found.</Text>
            ) : null
          }
        />
      )}

      {modalVisible && (
        <Modal transparent animationType="none" visible={modalVisible}>
          <Pressable style={styles.modalOverlay} onPress={closeOptions}>
            <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.modalHandle} />
              {selectedTrack?.album?.images?.[0]?.url && (
                <Image source={{ uri: selectedTrack.album.images[0].url }} style={styles.modalImage} />
              )}
              <Text style={styles.modalTitle}>{selectedTrack?.name}</Text>

              <Option
                icon={<Feather name="external-link" size={20} color={Colors.green} />}
                label="Open in Spotify"
                description="Listen directly on the Spotify app"
                onPress={() => {
                  Linking.openURL(selectedTrack?.external_urls.spotify);
                  closeOptions();
                }}
              />
              <Option
                icon={<Ionicons name="add-circle-outline" size={20} color={Colors.green} />}
                label="Add to Playlist"
                description="Save this track to your custom list"
                onPress={() => {}}
              />
              <Option
                icon={<FontAwesome5 name="share-alt" size={18} color={Colors.green} />}
                label="Share"
                description="Send to a friend or post online"
                onPress={() => {}}
              />
              <TouchableOpacity onPress={closeOptions}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: (StatusBar.currentHeight || 24) + 8,
    paddingBottom: 12,
    backgroundColor: Colors.dark.background,
  },
  searchBar: {
    backgroundColor: Colors.darkGray,
    color: Colors.white,
    borderRadius: 12,
    paddingLeft: 38,
    paddingRight: 38,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  searchIcon: {
    position: "absolute",
    left: 26,
    top: (StatusBar.currentHeight || 24) + 18,
    zIndex: 2,
  },
  clearIconWrapper: {
    position: "absolute",
    right: 26,
    top: (StatusBar.currentHeight || 24) + 14,
    zIndex: 2,
  },
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
  noResults: {
    color: Colors.lightGray,
    textAlign: "center",
    marginTop: 30,
    fontFamily: Fonts.regular,
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
});