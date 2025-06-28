import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import Track from '@/components/Track';

export default function ArtistScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [artist, setArtist] = useState<any>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setArtist(data);
      }
      setLoading(false);
    };
    fetchArtist();
  }, [id]);

  useEffect(() => {
    const fetchTopTracks = async () => {
      setLoadingTracks(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${id}/top-tracks?market=ES`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTopTracks(data.tracks || []);
      }
      setLoadingTracks(false);
    };
    if (id) fetchTopTracks();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors.white }}>Artist not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <View style={styles.bannerWrapper}>
        <Image source={{ uri: artist.images[0].url }} style={styles.bannerImage} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{artist.name}</Text>
          <Text style={styles.verified}>✓</Text>
        </View>
        <Text style={styles.subtitle}>
          {artist.followers?.total.toLocaleString()} monthly listeners
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL(artist.external_urls?.spotify)}
          style={styles.link}
        >
          <Text style={{ color: Colors.green }}>Open in Spotify</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Top Tracks</Text>
        {loadingTracks ? (
          <ActivityIndicator size="small" color={Colors.green} />
        ) : (
          <View style={styles.tracksContainer}>
            {topTracks.length > 0 ? (
              topTracks.map((track) => <Track key={track.id} track={track} />)
            ) : (
              <Text style={styles.noTracks}>No top tracks found.</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  bannerWrapper: {
    width: '100%',
    height: 250,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  name: {
    color: Colors.white,
    fontSize: 32,
    fontFamily: Fonts.bold,
    marginRight: 8,
    textAlign: 'center',
  },
  verified: {
    color: Colors.green,
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.lightGray,
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginTop: 30,
    marginBottom: 12,
    textAlign: 'center',
  },
  tracksContainer: {
    width: '100%',
    marginBottom: 20,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkGray,
    paddingHorizontal: 4,
    position: 'relative',
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  trackArtist: {
    color: Colors.lightGray,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  trackDuration: {
    color: Colors.lightGray,
    fontSize: 12,
    fontFamily: Fonts.light,
    position: 'absolute',
    right: 10,
  },
  noTracks: {
    color: Colors.lightGray,
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 10,
  },
});
